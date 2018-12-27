import os
from flask import Flask, request, send_file
import pickle
import json
import base64
import numpy as np
import h5py
app = Flask(__name__)

class Model:
    def __init__(self):
        self.encodings_path = '/data/nlp/vae/model/gmc/encodings_2d.hdf5'
        with open('/data/nlp/vae/model/gmc/encoding_word_indices.p', 'rb+') as f:
            self.encoding_word_indices = pickle.load(f)

#Initialization
global model
model = Model()

@app.route('/classes')
def classes():
    return json.dumps(sorted(list(model.encoding_word_indices.keys())))

@app.route('/data')
def data():
    label = request.args.get('label')
    with h5py.File(model.encodings_path) as f:
        data = {}
        i, n = model.encoding_word_indices[label]
        encodings = f['encodings'][i:i+n]
        mean = np.mean(encodings, axis=0)
        encodings_xy = [{'x': float(v[0]), 'y': float(v[1])} for v in encodings]
        mean_xy = {'x': float(mean[0]), 'y': float(mean[1])}
        data['encodings'] = encodings_xy
        data['mean'] = mean_xy
        return json.dumps(data)

@app.route('/point-original')
def original():
    label = request.args.get('label')
    idx = int(request.args.get('idx'))
    with h5py.File(model.encodings_path) as f:
        i, n = model.encoding_word_indices[label]
        filename = f['filenames'][i+idx].decode('utf-8')
        with open(os.path.join('/data/nlp/gmc/train', filename), 'rb') as img_file:
            return base64.b64encode(img_file.read())

@app.route('/point-reconstruction')
def reconstr():
    label = request.args.get('label')
    idx = int(request.args.get('idx'))
    with h5py.File(model.encodings_path) as f:
        i, n = model.encoding_word_indices[label]
        filename = f['filenames'][i+idx].decode('utf-8')
        with open(os.path.join('/data/nlp/vae/model/gmc/images', filename), 'rb') as img_file:
            return base64.b64encode(img_file.read())

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)
