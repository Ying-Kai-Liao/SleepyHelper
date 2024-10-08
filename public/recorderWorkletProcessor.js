class RecorderWorkletProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      if (input.length > 0) {
        const channelData = input[0]; // Assuming mono audio
        // Send data to main thread
        this.port.postMessage(channelData.slice(0));
      }
      return true;
    }
  }
  
  registerProcessor('recorder-worklet', RecorderWorkletProcessor);
  