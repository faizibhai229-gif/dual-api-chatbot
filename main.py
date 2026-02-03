import os
import json
import requests
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

def get_ai_response(message, history):
    """
    Dual-API fallback system:
    1. Tries DeepSeek Official API first
    2. Falls back to OpenRouter API if DeepSeek fails
    3. Returns error message if both fail
    """
    # Priority 1: DeepSeek Official API
    deepseek_key = os.getenv('DEEPSEEK_API_KEY')
    if deepseek_key:
        try:
            headers = {
                "Authorization": f"Bearer {deepseek_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "deepseek-chat",
                "messages": history + [{"role": "user", "content": message}]
            }
            response = requests.post(
                "https://api.deepseek.com/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        
        except Exception as e:
            print(f"DeepSeek Error: {str(e)}")

    # Priority 2: OpenRouter API
    openrouter_key = os.getenv('OPENROUTER_API_KEY')
    if openrouter_key:
        try:
            headers = {
                "Authorization": f"Bearer {openrouter_key}",
                "HTTP-Referer": request.host_url,
                "X-Title": "Dual-API Chatbot",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "deepseek/deepseek-chat",
                "messages": history + [{"role": "user", "content": message}]
            }
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        
        except Exception as e:
            print(f"OpenRouter Error: {str(e)}")

    # Final fallback
    return "⚠️ All AI services are currently unavailable. Please try again later."

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data['message']
    history = data.get('history', [])
    
    response = get_ai_response(message, history)
    return jsonify({"response": response})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)