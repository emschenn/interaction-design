import librosa
import soundfile
import pickle
import sys
import numpy as np
from librosa.core import istft

def extract_feature(file_name, mfcc, chroma, mel):
    with soundfile.SoundFile(file_name) as sound_file:
        X = sound_file.read(dtype="float32")
        X = istft(X)  # for our own file
        sample_rate=sound_file.samplerate
        if chroma:
            stft=np.abs(librosa.stft(X))
        result=np.array([])
        if mfcc:
            mfccs=np.mean(librosa.feature.mfcc(y=X, sr=sample_rate, n_mfcc=40).T, axis=0)
            result=np.hstack((result, mfccs))
        if chroma:
            chroma=np.mean(librosa.feature.chroma_stft(S=stft, sr=sample_rate).T,axis=0)
            result=np.hstack((result, chroma))
        if mel:
            mel=np.mean(librosa.feature.melspectrogram(X, sr=sample_rate).T,axis=0)
            result=np.hstack((result, mel))
    return result

model = pickle.load(open('./analysis_emotion/speech_emotion_analysis_model.sav', 'rb'))
#feature=extract_feature('./public/saved_audio/1.wav', mfcc=True, chroma=True, mel=True)

feature = extract_feature('./public/saved_audio/'+sys.argv[1], mfcc=True, chroma=True, mel=True)
result = model.predict(feature.reshape(1,-1))
print(result[0])
sys.stdout.flush()