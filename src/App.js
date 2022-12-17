import './App.css';
import Pizzicato from "pizzicato";
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import React, { useState, useEffect } from "react";

const audioCollections = {
  'Pure notes': ['/E2.mp3', '/C5.mp3', '/D5.mp3', '/E5.mp3', '/Fsharp5.mp3', '/G5.mp3', '/Gsharp5.mp3', '/A5.mp3', '/B5.mp3', '/Eminor arp.mp3'],
  'Glockenspiel': ['/strings low C.mp3', '/glockenspiel C lydian.mp3']
}

/**************************/
// Select audio collection here and refresh!
const currentCollection = 'Pure notes';
/**************************/

const audioFiles = audioCollections[currentCollection];
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

// HELPERS
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

const doOnAllSounds = (func) => {
  Object.values(soundsMap).forEach(func);
}
/*********** */

function App() {
  const [allPlaying, setAllPlaying] = useState(false);
  const [mainVol, setMainVol] = useState(.8);
  const [mainLow, setMainLow] = useState(100);
  const [mainLowFreq, setMainLowFreq] = useState(0);
  const [mainHigh, setMainHigh] = useState(0);
  const [mainHighFreq, setMainHighFreq] = useState(0);

  return (
    <div className="App">
      <MainToolbar
        allPlaying={allPlaying} setAllPlaying={setAllPlaying}
        mainVol={mainVol} setMainVol={setMainVol}
        mainLow={mainLow} setMainLow={setMainLow}
        mainLowFreq={mainLowFreq} setMainLowFreq={setMainLowFreq}
        mainHigh={mainHigh} setMainHigh={setMainHigh}
        mainHighFreq={mainHighFreq} setMainHighFreq={setMainHighFreq}
      />
      {audioFiles.map(f => <AudioTrack key={f} allPlaying={allPlaying} mainLow={mainLow} mainVol={mainVol} mainHigh={mainHigh} filename={f} />)}
    </div>
  );
}

const MainToolbar = ({ allPlaying, setAllPlaying, mainVol, setMainVol, mainLow, setMainLow, mainLowFreq, setMainLowFreq, mainHigh, setMainHigh, mainHighFreq, setMainHighFreq }) => {
  const onPlayAll = () => {
    doOnAllSounds(s => {
      const sound = s.sound;
      allPlaying ? sound.stop() : sound.play();      
    });
    setAllPlaying(!allPlaying);
  }
  const onVolumeAll = (value) => {
    doOnAllSounds(s => {
      const sound = s.sound;
      sound.volume = value;
    });    
    setMainVol(value);
  }
  
  const onLowPassAll = (value) => {
    let lowFreq = logslider(value, 20, 22000);
    setMainLow(value);
    setMainLowFreq(lowFreq);
    doOnAllSounds(s => {
      s.changePassFilters(lowFreq, mainHighFreq);
    });
  }  

  const onHighPassAll = (value) => {
    let highFreq = logslider(value, 20, 22000);
    setMainHigh(value);
    setMainHighFreq(highFreq);
    doOnAllSounds(s => {
      s.changePassFilters(mainLowFreq, highFreq);
    });
  } 

  const controlData = [
    { title: 'Main vol', onChange: ev => onVolumeAll(parseFloat(ev.target.value)), min: 0, max: 1, step: 0.01, value: mainVol, className: "volume-control", label: `${parseFloat(mainVol * 100).toFixed(2)}` },
    { title: 'Low Pass', onChange: ev => onLowPassAll(parseFloat(ev.target.value)), min: 0, max: 100, step: 1, value: mainLow, className: "freq-control", label: `${parseInt(mainLowFreq)} Hz` },
    { title: 'High Pass', onChange: ev => onHighPassAll(parseFloat(ev.target.value)), min: 0, max: 100, step: 1, value: mainHigh, className: "freq-control", label: `${parseInt(mainHighFreq)} Hz` }
  ];

  return <div className='main-toolbar'>
    <div className='collection-title'>{currentCollection}</div>
    <fieldset className='main-control'>
      <button className='play-button' onClick={() => onPlayAll()}>{`${allPlaying ? 'STOP' : 'PLAY'} ALL`}</button>
    </fieldset>
    {controlData.map(d => <SliderControl key={d.title} {...d} mainClassName={'main-control control'} />)}
  </div>
}

const AudioTrack = ({ filename, allPlaying, mainVol, mainHigh, mainLow }) => {
  const [inited, setInited] = useState(false);
  const [low, setLow] = useState(100);
  const [high, setHigh] = useState(0);

  const [lowFreq, setLowFreq] = useState(0);
  const [highFreq, setHighFreq] = useState(0);

  const [pan, setPan] = useState(0);
  const [vol, setVol] = useState(0.8);

  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(allPlaying);
  }, [allPlaying])

  useEffect(() => {
    setVol(mainVol);
  }, [mainVol]);

  useEffect(() => {
    setLow(mainLow);
    let lowFreq = logslider(mainLow, 20, 22000);
    setLowFreq(lowFreq);
  }, [mainLow]);

  useEffect(() => {
    setHigh(mainHigh);
    let highFreq = logslider(mainHigh, 20, 22000);
    setHighFreq(highFreq);
  }, [mainHigh]);

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

  const playback = () => {
    const sound = soundsMap[filename].sound;
    setPlaying(!playing);
    playing ? sound.stop() : sound.play();
  }

  const controlData = [
    { title: 'Volume', onChange: ev => changeVolumeValue(parseFloat(ev.target.value)), min: 0, max: 1, step: 0.01, value: vol, className: "volume-control", label: `${parseFloat(vol * 100).toFixed(2)}` },
    { title: 'Low Pass', onChange: ev => changeLow(parseFloat(ev.target.value)), min: 0, max: 100, step: 1, value: low, className: "freq-control", label: `${parseInt(lowFreq)} Hz` },
    { title: 'High Pass', onChange: ev => changeHigh(parseFloat(ev.target.value)), min: 0, max: 100, step: 1, value: high, className: "freq-control", label: `${parseInt(highFreq)} Hz` },
    { title: 'Pan', onChange: ev => changePanValue(parseFloat(ev.target.value)), min: -1, max: 1, step: 0.01, value: pan, className: "pan-control", label: `${parseFloat(pan * 100).toFixed(2)}` },
  ];

  return <section className='section'>
    <b className='track-title'>{filename}</b>
    <fieldset className='play-button'>
      <button onClick={() => playback()}>{(playing) ? 'Stop' : 'Play'}</button>
    </fieldset>
    {controlData.map(d => <SliderControl key={d.title} {...d} />)}    
    <div style={{ width: '0%', height: '0%' }} id={`audio-spectrum-${filename}`}></div>
  </section>
}

const SliderControl = ({ title, onChange, min, max, step, value, className, label, mainClassName = 'control' }) => {
  return <fieldset className={mainClassName}>
    <label>{title}</label>
    <input type='range' onChange={onChange} min={min} max={max} step={step} value={value}></input>
    <label className={className}>{label}</label>
  </fieldset>
}

export default App;