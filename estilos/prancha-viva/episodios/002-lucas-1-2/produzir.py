"""Produção local de Lucas 1–2. Nenhuma escrita fora deste episódio.

python3 produzir.py planejar | vozes [--completo] | som [--completo] | verificar
As tomadas reais são preservadas em audio/tomadas e reutilizadas por hash.
"""
import sys
sys.dont_write_bytecode = True
import argparse
import concurrent.futures
import hashlib
import json
import math
import re
import subprocess
import wave
from pathlib import Path

import numpy as np

EP = Path(__file__).resolve().parent
ROOT = EP.parents[3]
sys.path.insert(0, str(ROOT))
from nucleo import voz

SR = 24000
SAMPLE = ['P07', 'P08', 'P09', 'P21']
BOOK = json.loads((EP/'storyboard.json').read_text())
CAST = json.loads((EP/'elenco.json').read_text())
PRONUNCIA = json.loads((EP/'pronuncia.json').read_text()) if (EP/'pronuncia.json').is_file() else {}

def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2)+'\n')

def protected():
    baseline = json.loads((EP/'base-compartilhada.sha256.json').read_text())
    changed = [p for p,h in baseline.items() if hashlib.sha256((ROOT/p).read_bytes()).hexdigest()!=h]
    if changed:
        raise RuntimeError('Base protegida divergiu: '+', '.join(changed))
    return len(baseline)

def dest(complete):
    return EP/('filme' if complete else 'amostra')

def scenes(complete):
    return [a for a in BOOK['pranchas'] if complete or a['id'] in SAMPLE]

def write_wav(path, samples, rate=SR):
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path),'wb') as f:
        f.setnchannels(1 if samples.ndim==1 else samples.shape[1])
        f.setsampwidth(2); f.setframerate(rate)
        f.writeframes((np.clip(samples,-.999,.999)*32767).astype('<i2').tobytes())

def read_wav(path):
    data = subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ac','2','-ar',str(SR),'-'],capture_output=True,check=True).stdout
    return np.frombuffer(data,np.float32).reshape(-1,2).copy()

def room(n, seed=15):
    """Fundo rosado de sala, contínuo, sem conteúdo de fala repetido."""
    r=np.random.default_rng(seed)
    # Somar filtros com constantes distintas produz fundo suave sem zeros digitais.
    white=r.normal(0,1,n).astype(np.float32)
    out=white*.15
    for width,gain in [(9,.3),(43,.7),(179,1.0)]:
        cs=np.concatenate(([0.],np.cumsum(white,dtype=np.float64)))
        smooth=(cs[width:]-cs[:-width])/math.sqrt(width)
        out[width-1:]+=smooth*gain
    out*=.0011/(np.sqrt(np.mean(out*out))+1e-9)
    return out

def plan():
    protected()
    atos=[]; t=0
    for a in BOOK['pranchas']:
        duration=a['estimativa_s'];fs=[];weights=[max(1,len(f['texto'].split())) for f in a['falas']]
        cursor=1.6;available=max(1,duration-a['respiro_s']-1.6)
        for f,w in zip(a['falas'],weights):
            length=available*w/sum(weights)
            fs.append(dict(quem=f['quem'],texto=f['texto'],t0=round(cursor,3),t1=round(cursor+length,3)))
            cursor+=length+.5
        atos.append(dict(id=a['id'],cena=a['id'],titulo=a['titulo'],t0=t,t1=t+duration,falas=fs))
        t+=duration
    write_json(EP/'tempo-planejado.json',dict(formato='16:9',fps=24,total=t,estado='tempos estimados, sem TTS',atos=atos))
    print(f'Plano visual: {len(atos)} pranchas, {t:.1f}s. Base protegida íntegra.',flush=True)

def chunks(text):
    sentences=re.split(r'(?<=[.!?])\s+',text)
    out=[];current=''
    for sentence in sentences:
        if current and len((current+' '+sentence).split())>80:
            out.append(current);current=''
        current=(current+' '+sentence).strip()
    if current:out.append(current)
    assert ' '.join(out)==text
    return out

def request(a, idx, f, text):
    p=CAST['personagens'][f['quem']]
    direction=p['direcao_base']+'; sotaque brasileiro, pronúncia do Brasil. '+f.get('direcao','')
    if f['quem']=='Narrador': direction+='; sem pressa, sem anunciar um trailer'
    ajuste=PRONUNCIA.get(f'{a["id"]}:{idx//10}',{})
    if ajuste.get('direcao_adicional'):direction+='; '+ajuste['direcao_adicional']
    tts_text=text
    for original,falado in ajuste.get('substituicoes',{}).items():tts_text=tts_text.replace(original,falado)
    body=voz.corpo(CAST['modelo'],p,f'[{direction}] {tts_text}')
    tag=hashlib.sha256(json.dumps(body,sort_keys=True,ensure_ascii=False).encode()).hexdigest()[:16]
    path=EP/'audio/tomadas'/f'{a["id"]}-{idx:02}-{tag}.mp3'
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.is_file():
        print(f'Gerando {a["id"]} · {f["quem"]} · {len(text.split())} palavras',flush=True)
        temp=path.with_suffix('.recebendo')
        try:
            voz.falar(body,temp)
            if temp.stat().st_size<500:raise RuntimeError('Resposta de áudio vazia')
            # Validar o áudio antes de incorporá-lo ao cache.
            voice=voz.decode(temp)
            if len(voice)<SR*.2 or not np.isfinite(voice).all():raise RuntimeError('Áudio inválido')
            temp.rename(path)
        except BaseException:
            temp.unlink(missing_ok=True)
            raise
    clip=voz.decode(path).copy()
    peak=np.max(np.abs(clip))
    if peak<.02:raise RuntimeError('Tomada sem voz detectável: '+path.name)
    # Somente ganho de volume: sem mudança de altura ou velocidade.
    clip*=min(2.5,.77/peak)
    clip+=room(len(clip),int(tag[:6],16))*.4
    fade=min(240,len(clip)//10)
    clip[:fade]*=np.linspace(.02,1,fade);clip[-fade:]*=np.linspace(1,.02,fade)
    hop=int(SR*.04);envelope=[]
    for j in range(0,len(clip),hop):
        rms=np.sqrt(np.mean(clip[j:j+hop]**2))
        envelope.append(round(float(np.clip((rms-.006)*8,0,1)),3))
    return clip,path,envelope

def narrate(complete=False):
    protected();selected=scenes(complete);target=dest(complete);target.mkdir(exist_ok=True)
    jobs=[]
    for a in selected:
        for idx,f in enumerate(a['falas']):
            for part,text in enumerate(chunks(f['texto'])):
                jobs.append((a,idx,f,part,text))
    # Apenas três requisições independentes simultâneas, sem subagentes.
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        futures=[pool.submit(request,a,idx*10+part,f,text) for a,idx,f,part,text in jobs]
        results=[future.result() for future in futures]
    by_scene={a['id']:[] for a in selected}
    for (a,idx,f,part,text),result in zip(jobs,results):
        by_scene[a['id']].append((f,text,result))
    all_clips=[];atos=[];global_t=0
    for a in selected:
        entries=by_scene[a['id']];local=1.75;clips=[];lines=[]
        for f,text,(clip,path,envelope) in entries:
            length=len(clip)/SR
            lines.append(dict(quem=f['quem'],texto=text,t0=round(local,4),t1=round(local+length,4),arquivo=str(path.relative_to(EP)),envelope=envelope))
            clips.append((local,clip));local+=length+(1.3 if f['quem']!='Narrador' else .85)
        # Respiros adicionais nos gestos e nas revelações; nunca comprimir uma fala.
        total=local+max(3,a['respiro_s']-2)
        mix=room(round(total*SR),int(a['id'][1:])+19)
        for start,clip in clips:
            k=round(start*SR);mix[k:k+len(clip)]+=clip
        write_wav(target/'audio'/f'{a["id"]}-vozes.wav',mix)
        all_clips.append(mix)
        atos.append(dict(id=a['id'],cena=a['id'],titulo=a['titulo'],t0=round(global_t,4),t1=round(global_t+total,4),falas=lines))
        global_t+=total
    all_audio=np.concatenate(all_clips)
    write_wav(target/'audio/vozes.wav',all_audio)
    write_json(target/'tempo.json',dict(fps=24,formato='16:9',total=len(all_audio)/SR,estado='tempos reais das tomadas; elenco candidato',atos=atos))
    protected()
    print(f'Vozes montadas: {len(selected)} pranchas, {len(all_audio)/SR:.2f}s, {len(jobs)} tomadas. Base íntegra.',flush=True)

def score(complete=False):
    protected();target=dest(complete);timeline=json.loads((target/'tempo.json').read_text())
    n=round(timeline['total']*SR);music=np.zeros((n,2),np.float32);fx=np.zeros(n,np.float32)
    # Ré menor / fá maior. Frases originais com notas de passagem e repouso.
    chords=[[50,57,62,65],[46,53,58,62],[48,55,60,64],[45,52,57,60]]
    melody=[69,65,67,62,64,65,69,67,65,62,60,62,64,65,62,None]
    def add_note(at,duration,midi,amp,pan=0,kind='corda'):
        k=round(at*SR);length=min(round(duration*SR),n-k)
        if k<0 or length<1:return
        t=np.arange(length,dtype=np.float32)/SR;f=440*2**((midi-69)/12)
        attack=.65 if kind=='corda' else .025
        envelope=(1-np.exp(-t/attack))*np.exp(-t/(duration*(.6 if kind=='pinca' else 1.8)))
        envelope*=np.minimum(1,np.maximum(0,(duration-t)/(.8 if kind=='corda' else .28)))
        # Variação de amplitude de cada harmônico evita oscilador puro.
        signal=np.zeros(length,np.float32)
        for harmonic,vol in [(1,1),(2,.27),(3,.13),(4,.045)]:
            signal+=np.sin(TAU*f*harmonic*t+(.002 if kind=='corda' else 0)*np.sin(TAU*4.4*t))*vol
        signal*=envelope*amp
        music[k:k+length,0]+=signal*math.sqrt((1-pan)/2)
        music[k:k+length,1]+=signal*math.sqrt((1+pan)/2)
    TAU=2*math.pi
    for ai,a in enumerate(timeline['atos']):
        start,end=a['t0'],a['t1'];ident=a['id'];length=end-start
        tempo=66 if ident in ['P09','P21','P30','P31','P38','P39'] else 72
        beat=60/tempo;bar=beat*4
        for j,at in enumerate(np.arange(start,end,bar)):
            chord=chords[(j+ai)%len(chords)]
            for v,m in enumerate(chord):add_note(float(at),min(bar*1.8,end-at+1.5),m,.012 if v else .017,[-.45,.45,-.25,.25][v])
            if ident not in ['P21','P31','P38','P39']:
                for p in range(4):add_note(float(at+p*beat),beat*2,chord[p]+12,.012,(-1)**p*.45,'pinca')
        for j,at in enumerate(np.arange(start+2,end,beat*2)):
            note=melody[(j+ai*3)%len(melody)]
            if note and ident not in ['P31','P38','P39']:add_note(float(at),beat*2.3,note,.008,.14,'sopro')
        if ident in ['P07','P08','P09','P21']:
            # Ar ambiente de casa/abrigo: independente da trilha, sem silêncio digital.
            seg_n=round(length*SR);bed=room(seg_n,ai+110)*1.1
            k=round(start*SR);fx[k:min(n,k+seg_n)]+=bed[:min(seg_n,n-k)]
        # Automação musical segue cada fala; há ambiente natural mesmo nos recuos.
        for f in a['falas']:
            s=round((start+f['t0']-.2)*SR);z=min(n,round((start+f['t1']+.3)*SR));s=max(0,s)
            gain=.47 if f['quem']=='Narrador' else .32
            if ident in ['P09','P21']:gain*=.75
            env=np.full(z-s,gain,np.float32);fade=min(round(.2*SR),len(env)//2)
            if fade:
                env[:fade]=np.linspace(1,gain,fade);env[-fade:]=np.linspace(gain,1,fade)
            music[s:z]*=env[:,None]
        if ident=='P21':
            # Tecido: ruído filtrado curto, sem choro sintetizado ou som literal de parto.
            k=round((start+length*.58)*SR);ll=min(SR,n-k)
            if ll>0:fx[k:k+ll]+=room(ll,98)*np.sin(np.linspace(0,math.pi,ll))*.7
        if ident in ['P19','P20','P25','P34','P35','P36','P40']:
            # Passos baixos, afastados da dicção; nada de batida de perseguição.
            for j,at in enumerate(np.arange(start+1.3,min(end-2,start+12),.77)):
                k=round(at*SR);ll=min(round(.14*SR),n-k)
                if ll>0:fx[k:k+ll]+=room(ll,220+j)*np.exp(-np.linspace(0,6,ll))*(4 if j%2 else 5)
        if ident=='P01':
            for j,at in enumerate(np.arange(start+1,end-3,2.1)):
                k=round(at*SR);ll=min(round(.3*SR),n-k)
                if ll>0:fx[k:k+ll]+=room(ll,310+j)*np.sin(np.linspace(0,math.pi,ll))*.75
    # Reflexões curtas, não um reverb longo que embaralhe a palavra.
    for delay,gain in [(.093,.14),(.171,.09),(.287,.05)]:
        d=round(delay*SR);music[d:]+=music[:-d,::-1].copy()*gain
    fade=min(n,SR*3);music[-fade:]*=np.linspace(1,.015,fade)[:,None]
    write_wav(target/'audio/musica.wav',music)
    write_wav(target/'audio/ambiente.wav',fx+room(n,66)*.38)
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(target/'audio/vozes.wav'),'-i',str(target/'audio/musica.wav'),'-i',str(target/'audio/ambiente.wav'),'-filter_complex','[0:a]pan=stereo|c0=c0|c1=c0[v];[v][1:a][2:a]amix=inputs=3:normalize=0,alimiter=limit=0.92:level=0,loudnorm=I=-16:TP=-1.5:LRA=9[a]','-map','[a]','-ar',str(SR),str(target/'audio/mixagem.wav')],check=True)
    print(f'Música, ambiente e mixagem: {timeline["total"]:.2f}s.',flush=True)

def verify():
    count=protected();reports={}
    for name in ['amostra','filme']:
        p=EP/name/'audio/mixagem.wav'
        if not p.exists():continue
        a=read_wav(p);hop=round(SR*.05)
        windows=a[:len(a)//hop*hop].reshape(-1,hop,2)
        reports[name]={'duracao_s':round(len(a)/SR,3),'pico_dbfs_por_canal':[round(float(20*np.log10(max(1e-10,np.max(np.abs(a[:,ch]))))),2) for ch in range(2)],'janelas_50ms_abaixo_1e4_por_canal':[int(np.sum(np.max(np.abs(windows[:,:,ch]),axis=1)<1e-4)) for ch in range(2)]}
    result={'arquivos_protegidos_integros':count,'audio':reports}
    write_json(EP/'verificacao.json',result);print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('etapa',choices=['planejar','vozes','som','verificar']);parser.add_argument('--completo',action='store_true');args=parser.parse_args()
    if args.etapa=='planejar':plan()
    elif args.etapa=='vozes':narrate(args.completo)
    elif args.etapa=='som':score(args.completo)
    else:verify()
