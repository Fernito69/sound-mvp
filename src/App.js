import './App.css';
import Pizzicato from "pizzicato";
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import React, { useState, useEffect } from "react";

// const audioFiles = ['/audio_short.mp3'];
const audioFiles = ['/E2.mp3', '/E5.mp3', '/Gsharp5.mp3', '/B5.mp3'];
const soundsMap = {};

audioFiles.forEach(filename => {
  soundsMap[filename] = {};

  const lowPassFilter = new Pizzicato.Effects.LowPassFilter({
    frequency: 22050,
    peak: 5
  });

  const highPassFilter = new Pizzicato.Effects.HighPassFilter({
    frequency: 0,
    peak: 5
  });

  const panEffect = new Pizzicato.Effects.StereoPanner({
    pan: 0.0
  });

  const sound = new Pizzicato.Sound(filename, () => {
    sound.addEffect(lowPassFilter);
    sound.addEffect(highPassFilter);
    sound.addEffect(panEffect)
    sound.volume = 0.8;
    // sound.play();

    // Init visualizer
    // const el = document.getElementById(`audio-spectrum-${filename}`);
    // const audioMotion = new AudioMotionAnalyzer(el, {
    //   audioCtx: Pizzicato.context
    // });
    // audioMotion.connectInput(sound.getInputNode());
  });

  soundsMap[filename].sound = sound;

  soundsMap[filename].changePassFilters = (low, high) => {
    lowPassFilter.frequency = low;
    highPassFilter.frequency = high;
    console.log("current low: ", low, " high: ", high);
  }

  soundsMap[filename].changePan = (pan) => {
    panEffect.pan = pan;
    console.log("pan:", pan);
  }
});

function App() {
  return (
    <div className="App">
      {audioFiles.map(f => <AudioTrack key={f} filename={f} />)}
    </div>
  );
}

export default App;

const AudioTrack = ({ filename }) => {
  const [inited, setInited] = useState(false);
  const [low, setLow] = useState(100);
  const [high, setHigh] = useState(0);

  const [lowFreq, setLowFreq] = useState(0);
  const [highFreq, setHighFreq] = useState(0);

  const [pan, setPan] = useState(0);
  const [vol, setVol] = useState(0.8);

  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!inited) {
      // Initialize once
      changeLow(100);
      changeHigh(0);
      setInited(true);
    }
  });

  const changeLow = (low) => {
    setLow(low);

    let lowFreq = logslider(low, 20, 22000);
    setLowFreq(lowFreq);
    soundsMap[filename].changePassFilters(lowFreq, highFreq);
  }

  const changeHigh = (high) => {
    setHigh(high);

    let highFreq = logslider(high, 20, 22000);
    setHighFreq(highFreq);
    soundsMap[filename].changePassFilters(lowFreq, highFreq);
  }

  const changePanValue = (pan) => {
    setPan(pan);
    soundsMap[filename].changePan(pan);
  }

  const changeVolumeValue = (volume) => {
    setVol(volume);
    soundsMap[filename].sound.volume = volume;
  }

  const logslider = (position, minv_val, maxv_val) => {
    // position will be between 0 and 100
    var minp = 0;
    var maxp = 100;

    // The result should be between 100 an 10000000
    var minv = Math.log(minv_val);
    var maxv = Math.log(maxv_val);

    // calculate adjustment factor
    var scale = (maxv - minv) / (maxp - minp);

    return Math.exp(minv + scale * (position - minp));
  }

  const playback = () => {
    const sound = soundsMap[filename].sound;
    setPlaying(!playing);
    playing ? sound.stop() : sound.play();
  }

  return <section>
    <b style={{ backgroundColor: 'green' }}>{filename}</b>
    <fieldset>
      <button onClick={() => playback()}>{playing ? 'Stop' : 'Play'}</button>
    </fieldset>
    <fieldset>
      <label>Volume</label>
      <input type='range' onChange={ev => changeVolumeValue(parseFloat(ev.target.value))} min={0} max={1} step={0.01} value={vol}></input>
      <label className="pan">{parseFloat(vol * 100).toFixed(2)}</label>
    </fieldset>
    <fieldset>
      <label>Low Pass</label>
      <input type='range' onChange={ev => changeLow(parseFloat(ev.target.value))} min={0} max={100} step={1} value={low}></input>
      <label className="freq">{parseInt(lowFreq)} Hz</label>
    </fieldset>
    <fieldset>
      <label>High Pass</label>
      <input type='range' onChange={ev => changeHigh(parseFloat(ev.target.value))} min={0} max={100} step={1} value={high}></input>
      <label className="freq">{parseInt(highFreq)} Hz</label>
    </fieldset>
    <fieldset>
      <label>Pan</label>
      <input type='range' onChange={ev => changePanValue(parseFloat(ev.target.value))} min={-1} max={1} step={0.01} value={pan}></input>
      <label className="pan">{parseFloat(pan).toFixed(2)}</label>
    </fieldset>
    <div style={{ width: '0%', height: '0%' }} id={`audio-spectrum-${filename}`}></div>
  </section>
}