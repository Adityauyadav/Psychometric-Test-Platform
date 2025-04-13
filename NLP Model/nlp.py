import os
os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
os.environ["TORCH_USE_CUDA_DSA"] = "1"

from flask import Flask, request, jsonify
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from scipy.spatial.distance import euclidean

app = Flask(__name__)
embedding_model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')

def get_embedding(text):
    return embedding_model.encode([text])[0]

def calculate(good, bad, user):
    A = get_embedding(good)
    B = get_embedding(bad)
    C = get_embedding(user)

    # Cosine Similarities
    cos_AB = cosine_similarity([A], [B])[0][0]
    cos_AC = cosine_similarity([A], [C])[0][0]
    cos_BC = cosine_similarity([B], [C])[0][0]

    # Euclidean Distances
    euc_AB = euclidean(A, B)
    euc_AC = euclidean(A, C)
    euc_BC = euclidean(B, C)

    AB = [cos_AB, euc_AB]
    AC = [cos_AC, euc_AC]
    BC = [cos_BC, euc_BC]

    return AB, AC, BC

def result(AB, AC, BC, penalty_weight=0.5):
    def cosine_similarity(v1, v2):
        v1 = np.array(v1)
        v2 = np.array(v2)
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-8)

    AB = np.array(AB)
    AC = np.array(AC)
    BC = np.array(BC)

    sim_AC = cosine_similarity(AC, [1, 0]) 
    sim_BC = cosine_similarity(AC, BC)

    AB_magnitude = np.linalg.norm(AB)
    penalty = penalty_weight * sim_BC * (AB_magnitude / (AB_magnitude + 1))

    score = sim_AC - penalty
    return max(0, min(1, (score + 1) / 2)) * 10

@app.route('/evaluate', methods=['POST'])
def evaluate():
    data = request.json
    good = data.get('good')
    bad = data.get('bad')
    user = data.get('user')

    if not all([good, bad, user]):
        return jsonify({'error': 'All inputs (good, bad, user) are required'}), 400

    AB, AC, BC = calculate(good, bad, user)
    score = result(AB, AC, BC)
    return jsonify({'score': score})

if __name__ == '__main__':
    app.run(debug=True)
