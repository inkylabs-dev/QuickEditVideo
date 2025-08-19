#!/usr/bin/env python3

import numpy as np
import json
import sys
import os

def convert_npz_to_json(npz_path, json_path):
    """Convert NPZ file to JSON format for use in browser."""
    try:
        # Load the NPZ file
        data = np.load(npz_path)
        
        # Convert to JSON-serializable format
        json_data = {}
        for key in data.files:
            array = data[key]
            # Convert numpy array to list for JSON serialization
            json_data[key] = array.tolist()
            print(f"Converted {key}: shape {array.shape}, dtype {array.dtype}")
        
        # Write to JSON file
        with open(json_path, 'w') as f:
            json.dump(json_data, f, separators=(',', ':'))  # Compact JSON
        
        print(f"Successfully converted {npz_path} to {json_path}")
        
        # Show file sizes
        npz_size = os.path.getsize(npz_path)
        json_size = os.path.getsize(json_path)
        print(f"NPZ size: {npz_size / 1024:.1f} KB")
        print(f"JSON size: {json_size / 1024:.1f} KB")
        
        return json_data
        
    except Exception as e:
        print(f"Error converting NPZ to JSON: {e}")
        sys.exit(1)

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    tts_dir = os.path.join(script_dir, '..', 'public', 'tts')
    
    npz_path = os.path.join(tts_dir, 'voices.npz')
    json_path = os.path.join(tts_dir, 'voices.json')
    
    if not os.path.exists(npz_path):
        print(f"Error: {npz_path} not found. Please run 'npm run download-tts' first.")
        sys.exit(1)
    
    if os.path.exists(json_path):
        print(f"JSON file already exists at {json_path}. Overwriting...")
    
    data = convert_npz_to_json(npz_path, json_path)
    
    # Print summary of voice data
    print("\nVoice data summary:")
    for key, value in data.items():
        if isinstance(value, list):
            print(f"  {key}: {len(value)} elements")
        else:
            print(f"  {key}: {type(value)}")

if __name__ == "__main__":
    main()