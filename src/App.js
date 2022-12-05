import './App.css';
import Pizzicato from "pizzicato";
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import React, { useState, useEffect } from "react";

const lowPassFilter = new Pizzicato.Effects.LowPassFilter({
  frequency: 22050,
  peak: 5
});

const highPassFilter = new Pizzicato.Effects.HighPassFilter({
  frequency: 0,
  peak: 5
});

const sound1 = new Pizzicato.Sound('/audio_short.mp3', () => {
  sound1.addEffect(lowPassFilter);
  sound1.addEffect(highPassFilter);
  sound1.play();
  sound1.volume = 0.8;

  // Init visualizer
  const el = document.getElementById("audio-spectrum");
  const audioMotion = new AudioMotionAnalyzer(el, {
      audioCtx: Pizzicato.context
    });
  audioMotion.connectInput(sound1.getInputNode());          
});

const changePassFilters = (low, high) => {
  lowPassFilter.frequency = low;
  highPassFilter.frequency = high;
  console.log("current low: ", low, " high: ", high);
}

function App() {
  const [inited, setInited] = useState(false);
  const [low, setLow] = useState(100);
  const [high, setHigh] = useState(0);

  const [lowFreq, setLowFreq] = useState(0);
  const [highFreq, setHighFreq] = useState(0);

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
    changePassFilters(lowFreq, highFreq);
  }

  const changeHigh = (high) => {
      setHigh(high);

      let highFreq = logslider(high, 20, 22000);
      setHighFreq(highFreq);
      changePassFilters(lowFreq, highFreq);
  }

  const logslider = (position, minv_val, maxv_val)  => {
    // position will be between 0 and 100
    var minp = 0;
    var maxp = 100;
  
    // The result should be between 100 an 10000000
    var minv = Math.log(minv_val);
    var maxv = Math.log(maxv_val);
  
    // calculate adjustment factor
    var scale = (maxv-minv) / (maxp-minp);
  
    return Math.exp(minv + scale*(position-minp));
  }

  return (
    <div className="App">
      <section>
        <fieldset>
          <label>Low Pass</label>
          <input type='range' onChange={ev => changeLow(parseFloat(ev.target.value))} min={0} max={100} step={1} value={low}></input>
          <label  className="freq">{parseInt(lowFreq)} Hz</label>
        </fieldset>
        <fieldset>
          <label>High Pass</label>
          <input type='range' onChange={ev => changeHigh(parseFloat(ev.target.value))} min={0} max={100} step={1} value={high}></input>
          <label className="freq">{parseInt(highFreq)} Hz</label>
        </fieldset>
      <div id="audio-spectrum"></div>
      </section>
    </div>
  );
}

export default App;
