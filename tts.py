import torch
from google import genai
import numpy as np
from transformers import VitsModel, AutoTokenizer
from scipy.io.wavfile import write
import os
import time

# Load the Hausa TTS model
model = VitsModel.from_pretrained("facebook/mms-tts-hau")
tokenizer = AutoTokenizer.from_pretrained("facebook/mms-tts-hau")

def speak_text(text):
    """Converts Hausa text to speech and returns the audio file URL."""
    # Create a unique filename using a timestamp
    timestamp = int(time.time() * 1000)  # Milliseconds
    audio_filename = f"response_{timestamp}.wav"
    
    # Ensure the /static/audio/ directory exists
    audio_dir = os.path.join("static", "audio")
    os.makedirs(audio_dir, exist_ok=True)
    
    # Full path to save the audio file
    audio_path = os.path.join(audio_dir, audio_filename)
    
    # Tokenize the text
    inputs = tokenizer(text, return_tensors="pt")

    # Generate the waveform
    with torch.no_grad():
        output = model(**inputs).waveform.numpy()

    # Save the audio file
    write(audio_path, model.config.sampling_rate, output[0])

    # Return the URL path (relative to the web server)
    audio_url = f"/static/audio/{audio_filename}"
    return audio_url