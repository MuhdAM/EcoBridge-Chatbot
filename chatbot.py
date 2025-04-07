# Compatibility layer at the top
import sys
import google.generativeai as genai
sys.modules['google.genai'] = genai

# Original code with fixes
import torch
from google import genai
import sounddevice as sd
import numpy as np
from transformers import VitsModel, AutoTokenizer
from scipy.io.wavfile import write

# Configure API
genai.configure(api_key="AIzaSyBYTm1SltoOQRs9PhAXb3I4LKvEvwalVx0")

# Load TTS model
model = VitsModel.from_pretrained("facebook/mms-tts-hau")
tokenizer = AutoTokenizer.from_pretrained("facebook/mms-tts-hau")

DEFAULT_PROMPT = """
You are a Hausa conversational assistant. Respond in Hausa concisely (1-2 sentences).
"""

chat_memory = [{"role": "system", "content": DEFAULT_PROMPT}]

def get_ai_response(user_input):
    try:
        # Use the updated model name
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        response = gemini_model.generate_content(
            f"{DEFAULT_PROMPT}\n\nUser: {user_input}\nAI:"
        )
        chat_memory.append({"role": "system", "content": response.text})
        return response.text.strip()
    except Exception as e:
        return f"Error: {str(e)}"

# Rest of the code (text_to_speech, chat) remains unchanged...

def text_to_speech(text):
    """ Converts Hausa text to speech and plays the audio. """
    inputs = tokenizer(text, return_tensors="pt")

    with torch.no_grad():
        output = model(**inputs).waveform.numpy()

    # Save audio file
    write("response.wav", model.config.sampling_rate, output[0])

    # Play the audio
    sd.play(output[0], samplerate=model.config.sampling_rate)
    sd.wait()

def chat():
    """ Main chat loop. """
    print("🔵 AI (in Hausa): Sannu! Ina bukatar tambaya daga gare ka.")

    while True:
        user_input = input("🟢 Kai: ")  # User inputs text
        if user_input.lower() in ["bye", "sai anjima", "ban gaji ba"]:
            print("🔵 AI: Sai anjima! 👋")
            break

        response = get_ai_response(user_input)  # Get AI response
        print(f"🔵 AI: {response}")  # Print AI response
        text_to_speech(response)  # Convert AI response to speech & play

if __name__ == "__main__":
    chat()