# Author: Fisheep.L
"""
商海浮沉 BGM 纯音乐生成器
风格：沉稳中带紧张感的商业策略氛围，适合放置类游戏循环播放
时长：约90秒，可无缝循环
"""

import numpy as np
import struct
import wave
import os

SAMPLE_RATE = 44100
BPM = 88
BEAT = 60.0 / BPM  # 一拍时长(秒)

# ============ 音色合成 ============

def sine(freq, t):
    return np.sin(2 * np.pi * freq * t)

def triangle(freq, t):
    return 2 * np.abs(2 * (freq * t - np.floor(freq * t + 0.5))) - 1

def sawtooth(freq, t):
    return 2 * (freq * t - np.floor(freq * t + 0.5))

def square(freq, t, duty=0.5):
    return np.where((freq * t % 1) < duty, 1.0, -1.0)

def noise(t):
    return np.random.uniform(-1, 1, len(t))

def adsr(note_len, a=0.02, d=0.1, s=0.6, r=0.15, sr=SAMPLE_RATE):
    """生成 ADSR 包络"""
    n = int(note_len * sr)
    env = np.zeros(n)
    na = min(int(a * sr), n)
    nd = min(int(d * sr), n - na)
    nr = min(int(r * sr), n - na - nd)
    ns = n - na - nd - nr
    i = 0
    if na > 0:
        env[i:i+na] = np.linspace(0, 1, na)
        i += na
    if nd > 0:
        env[i:i+nd] = np.linspace(1, s, nd)
        i += nd
    if ns > 0:
        env[i:i+ns] = s
        i += ns
    if nr > 0:
        env[i:i+nr] = np.linspace(s, 0, nr)
    return env

def pad(freq, dur, t_offset, vol=0.15):
    """柔和垫音：正弦+微弱三角波"""
    n = int(dur * SAMPLE_RATE)
    t = np.linspace(t_offset, t_offset + dur, n, endpoint=False)
    sig = 0.7 * sine(freq, t) + 0.3 * triangle(freq, t)
    # 加入轻微合唱效果(微调频率)
    sig += 0.2 * sine(freq * 1.003, t)
    env = adsr(dur, a=0.3, d=0.2, s=0.5, r=0.4)
    return sig * env * vol

def bass(freq, dur, t_offset, vol=0.25):
    """深沉贝斯：正弦+少量方波"""
    n = int(dur * SAMPLE_RATE)
    t = np.linspace(t_offset, t_offset + dur, n, endpoint=False)
    sig = 0.8 * sine(freq, t) + 0.2 * square(freq, t, 0.3)
    env = adsr(dur, a=0.01, d=0.1, s=0.7, r=0.15)
    return sig * env * vol

def piano(freq, dur, t_offset, vol=0.2):
    """钢琴音色：正弦+泛音衰减"""
    n = int(dur * SAMPLE_RATE)
    t = np.linspace(t_offset, t_offset + dur, n, endpoint=False)
    sig = 0.6 * sine(freq, t) + 0.25 * sine(freq*2, t) + 0.1 * sine(freq*3, t) + 0.05 * sine(freq*4, t)
    env = adsr(dur, a=0.005, d=0.15, s=0.4, r=0.3)
    return sig * env * vol

def bell(freq, dur, t_offset, vol=0.08):
    """钟声音色：清脆点缀"""
    n = int(dur * SAMPLE_RATE)
    t = np.linspace(t_offset, t_offset + dur, n, endpoint=False)
    sig = 0.4 * sine(freq, t) + 0.3 * sine(freq*2.756, t) + 0.2 * sine(freq*5.404, t) + 0.1 * sine(freq*8.933, t)
    env = adsr(dur, a=0.001, d=0.3, s=0.2, r=0.5)
    return sig * env * vol

def hihat(dur, t_offset, vol=0.06):
    """轻柔踩镲"""
    n = int(dur * SAMPLE_RATE)
    t = np.linspace(t_offset, t_offset + dur, n, endpoint=False)
    sig = noise(t)
    env = adsr(dur, a=0.001, d=0.03, s=0.0, r=0.02)
    # 高通滤波模拟
    sig = np.diff(np.append(0, sig)) * 3
    return sig * env * vol

def kick(dur, t_offset, vol=0.2):
    """底鼓"""
    n = int(dur * SAMPLE_RATE)
    t = np.linspace(t_offset, t_offset + dur, n, endpoint=False)
    freq_sweep = 150 * np.exp(-t * 30) + 40
    phase = np.cumsum(freq_sweep / SAMPLE_RATE) * 2 * np.pi
    sig = np.sin(phase)
    env = adsr(dur, a=0.001, d=0.05, s=0.1, r=0.1)
    return sig * env * vol

# ============ 和弦进行 ============
# 和弦进行两组：主段+副段
CHORDS_A = [
    # Cm7: C Eb G Bb
    [261.63, 311.13, 392.00, 466.16],
    # Abmaj7: Ab C Eb G
    [207.65, 261.63, 311.13, 392.00],
    # Ebmaj7: Eb G Bb D
    [311.13, 392.00, 466.16, 293.66],
    # Bb7sus4: Bb Eb F Ab
    [233.08, 311.13, 349.23, 207.65],
]

CHORDS_B = [
    # Fm7: F Ab C Eb
    [174.61, 207.65, 261.63, 311.13],
    # Gm7: G Bb D F
    [196.00, 233.08, 293.66, 349.23],
    # Abmaj7: Ab C Eb G
    [207.65, 261.63, 311.13, 392.00],
    # G7: G B D F
    [196.00, 246.94, 293.66, 349.23],
]

# 低音线
BASS_NOTES_A = [
    130.81,  # C3
    103.83,  # Ab2
    155.56,  # Eb3
    116.54,  # Bb2
]

BASS_NOTES_B = [
    87.31,   # F2
    98.00,   # G2
    103.83,  # Ab2
    98.00,   # G2
]

# 旋律音符 - A段主旋律(沉稳冷静)
MELODY_A1 = [
    (523.25, 0.5), (0, 0.5), (466.16, 0.5), (392.00, 1.0), (311.13, 0.5), (0, 1.0),
    (349.23, 0.5), (392.00, 0.5), (311.13, 1.0), (261.63, 0.5), (0, 0.5),
]
MELODY_A2 = [
    (466.16, 0.25), (466.16, 0.25), (523.25, 0.5), (622.25, 0.5), (523.25, 0.5), (466.16, 0.5),
    (392.00, 0.5), (349.23, 0.5), (311.13, 1.0), (0, 1.0),
    (523.25, 0.5), (622.25, 0.5), (523.25, 0.25), (466.16, 0.25), (392.00, 0.5), (349.23, 0.5),
    (311.13, 1.0), (261.63, 0.5), (0, 0.5),
]

# B段副旋律(紧张攀升)
MELODY_B1 = [
    (622.25, 0.5), (523.25, 0.5), (466.16, 0.5), (0, 0.5),
    (523.25, 1.0), (466.16, 0.5), (392.00, 0.5),
    (349.23, 0.5), (311.13, 1.0), (0, 1.5),
    (466.16, 0.5), (523.25, 0.5), (622.25, 0.5), (0, 0.5),
    (523.25, 1.0), (392.00, 0.5), (349.23, 0.5),
    (311.13, 1.0), (261.63, 0.5), (0, 0.5),
]
MELODY_B2 = [
    (698.46, 0.5), (622.25, 0.5), (523.25, 0.25), (466.16, 0.25),
    (523.25, 1.0), (622.25, 0.5), (698.46, 0.5),
    (622.25, 0.5), (523.25, 1.0), (0, 1.0),
    (783.99, 0.5), (698.46, 0.5), (622.25, 0.5), (523.25, 0.5),
    (622.25, 1.0), (523.25, 0.5), (466.16, 0.5),
    (392.00, 1.0), (311.13, 0.5), (261.63, 0.5), (0, 0.5),
]

# ============ 合成主程序 ============

def generate_bgm():
    # 32小节: A段(0-15) + B段(16-31)
    total_bars = 32
    total_beats = total_bars * 4
    total_duration = total_beats * BEAT
    total_samples = int(total_duration * SAMPLE_RATE)
    out = np.zeros(total_samples)

    def add_at(signal, offset_samples):
        """在指定偏移处叠加信号"""
        nonlocal out
        end = offset_samples + len(signal)
        if end > len(out):
            signal = signal[:len(out) - offset_samples]
            end = len(out)
        if offset_samples < 0:
            signal = signal[-offset_samples:]
            offset_samples = 0
        out[offset_samples:end] += signal

    def t2s(t):
        """时间(秒)转采样偏移"""
        return int(t * SAMPLE_RATE)

    def play_melody(melody_notes, start_time, vol=0.18, instrument='piano'):
        """播放一段旋律"""
        t = start_time
        for freq, beats in melody_notes:
            dur = beats * BEAT
            if freq > 0:
                if instrument == 'piano':
                    sig = piano(freq, dur * 0.9, t, vol=vol)
                else:
                    sig = bell(freq, dur * 0.9, t, vol=vol)
                add_at(sig, t2s(t))
            t += dur

    # ============ A段 (0-15小节): 沉稳、冷静 ============
    # 节奏层
    for bar in range(16):
        bar_t = bar * 4 * BEAT
        # 底鼓 1、3拍
        for b in [0, 2]:
            add_at(kick(0.3, bar_t + b * BEAT, vol=0.16), t2s(bar_t + b * BEAT))
        # 踩镲 每拍后半拍
        for b in range(4):
            ht = bar_t + (b + 0.5) * BEAT
            add_at(hihat(0.08, ht, vol=0.035), t2s(ht))

    # 贝斯层
    for bar in range(16):
        chord_idx = bar % 4
        bar_t = bar * 4 * BEAT
        bass_freq = BASS_NOTES_A[chord_idx]
        for b in [0, 2]:
            bt = bar_t + b * BEAT
            add_at(bass(bass_freq, BEAT * 1.8, bt, vol=0.07), t2s(bt))

    # 和弦垫音
    for bar in range(16):
        chord_idx = bar % 4
        bar_t = bar * 4 * BEAT
        chord = CHORDS_A[chord_idx]
        dur = 4 * BEAT
        for freq in chord:
            add_at(pad(freq, dur, bar_t, vol=0.08), t2s(bar_t))

    # A1旋律 (第2小节开始)
    play_melody(MELODY_A1, 4 * BEAT, vol=0.17)
    # A2旋律 (第6小节开始)
    play_melody(MELODY_A2, 12 * BEAT, vol=0.15)
    # 重复A1 (第10小节，略有变化)
    play_melody(MELODY_A1, 20 * BEAT, vol=0.16)

    # ============ B段 (16-31小节): 紧张攀升 ============
    # 节奏加强
    for bar in range(16, 32):
        bar_t = bar * 4 * BEAT
        for b in [0, 2]:
            add_at(kick(0.3, bar_t + b * BEAT, vol=0.20), t2s(bar_t + b * BEAT))
        # 踩镲更密：每半拍
        for b in range(8):
            ht = bar_t + b * BEAT * 0.5
            add_at(hihat(0.06, ht, vol=0.045), t2s(ht))

    # 贝斯层 B段
    for bar in range(16, 32):
        chord_idx = (bar - 16) % 4
        bar_t = bar * 4 * BEAT
        bass_freq = BASS_NOTES_B[chord_idx]
        # 更活跃的贝斯
        for b in [0, 1.5, 2, 3.5]:
            bt = bar_t + b * BEAT
            add_at(bass(bass_freq, BEAT * 0.9, bt, vol=0.06), t2s(bt))

    # 和弦垫音 B段
    for bar in range(16, 32):
        chord_idx = (bar - 16) % 4
        bar_t = bar * 4 * BEAT
        chord = CHORDS_B[chord_idx]
        dur = 4 * BEAT
        for freq in chord:
            add_at(pad(freq, dur, bar_t, vol=0.10), t2s(bar_t))

    # B1旋律 (第18小节)
    play_melody(MELODY_B1, 18 * 4 * BEAT, vol=0.16)
    # B2旋律 (第24小节，高潮)
    play_melody(MELODY_B2, 24 * 4 * BEAT, vol=0.18)

    # ============ 点缀 ============
    # 钟声点缀
    bell_data = [
        (2 * BEAT, 1046.50),    # C6
        (6 * BEAT, 830.61),     # Ab5
        (14 * BEAT, 932.33),    # Bb5
        (22 * BEAT, 783.99),    # G5
        (30 * BEAT, 1046.50),   # C6
        (50 * BEAT, 830.61),    # Ab5
        (62 * BEAT, 932.33),    # Bb5
        (78 * BEAT, 1174.66),   # D6 高潮点
        (110 * BEAT, 1046.50),  # C6
        (122 * BEAT, 783.99),   # G5
    ]
    for bt, freq in bell_data:
        add_at(bell(freq, 1.5, bt, vol=0.05), t2s(bt))

    # ---- 尾部淡出 + 头部淡入（无缝循环）----
    fade_len = int(3.0 * SAMPLE_RATE)
    fade_in = np.linspace(0, 1, fade_len)
    out[:fade_len] *= fade_in
    fade_out = np.linspace(1, 0, fade_len)
    out[-fade_len:] *= fade_out

    # ---- 归一化 ----
    peak = np.max(np.abs(out))
    if peak > 0:
        out = out / peak * 0.82

    return out

def save_wav(samples, filepath):
    """保存为16bit WAV"""
    data = (samples * 32767).astype(np.int16)
    with wave.open(filepath, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(data.tobytes())
    print(f"WAV saved: {filepath} ({len(samples)/SAMPLE_RATE:.1f}s)")

if __name__ == '__main__':
    print("正在生成《商海浮沉》BGM...")
    samples = generate_bgm()
    out_dir = os.path.dirname(os.path.abspath(__file__))
    wav_path = os.path.join(out_dir, 'bgm.wav')
    save_wav(samples, wav_path)
    print(f"文件大小: {os.path.getsize(wav_path)/1024:.0f} KB")
    print("完成！可在游戏中循环播放。")
