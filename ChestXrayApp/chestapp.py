# app.py
import streamlit as st
import torch
import torchvision.transforms as transforms
from torchvision import models
import torch.nn as nn
import numpy as np
import cv2
from PIL import Image
import os

# Disease labels
class_names = [
    'Atelectasis', 'Cardiomegaly', 'Consolidation', 'Edema', 'Effusion',
    'Emphysema', 'Fibrosis', 'Hernia', 'Infiltration', 'Mass',
    'Nodule', 'Pleural_Thickening', 'Pneumonia', 'Pneumothorax', 'No Finding'
]

# Load model
@st.cache_resource
def load_model():
    model = models.densenet121(pretrained=False)
    model.classifier = nn.Linear(1024, len(class_names))
    model.load_state_dict(torch.load("chexnet_model.pth", map_location=torch.device('cpu')))
    model.eval()
    return model

# Image transform
def transform_image(image):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    return transform(image).unsqueeze(0)

# Grad-CAM
def generate_gradcam(model, image_tensor, class_idx, layer_name='features.denseblock4'):
    gradients, activations = [], []

    def save_gradient(grad):
        gradients.append(grad)

    def forward_hook(module, input, output):
        activations.append(output)
        output.register_hook(save_gradient)

    layer = dict([*model.named_modules()])[layer_name]
    handle = layer.register_forward_hook(forward_hook)

    model.zero_grad()
    output = model(image_tensor)[0, class_idx]
    output.backward()

    grads = gradients[0].squeeze().detach().numpy()
    acts = activations[0].squeeze().detach().numpy()
    weights = np.mean(grads, axis=(1, 2))
    cam = np.sum(weights[:, None, None] * acts, axis=0)
    cam = np.maximum(cam, 0)
    cam = cv2.resize(cam, (224, 224))
    cam -= cam.min()
    cam /= cam.max()

    handle.remove()
    return cam

# UI
st.title("🩺 Chest X-ray Disease Detector with Grad-CAM")
st.markdown("Upload a Chest X-ray and get predictions + heatmap.")
uploaded_file = st.file_uploader("Upload X-ray Image", type=['jpg', 'jpeg', 'png'])

if uploaded_file is not None:
    image = Image.open(uploaded_file).convert("RGB")
    st.image(image, caption="Uploaded X-ray", use_column_width=True)

    model = load_model()
    input_tensor = transform_image(image)

    with st.spinner("Predicting..."):
        output = model(input_tensor)
        probs = torch.sigmoid(output).detach().numpy().squeeze()
        top_idx = int(np.argmax(probs))

    st.markdown("### 🔍 Top Prediction")
    st.success(f"{class_names[top_idx]} — {probs[top_idx]:.2%}")

    st.markdown("### 🌡️ Grad-CAM Heatmap")
    cam = generate_gradcam(model, input_tensor, top_idx)
    img_np = np.array(image.resize((224, 224))) / 255.0
    heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)[..., ::-1] / 255.0
    overlay = 0.4 * heatmap + 0.6 * img_np
    st.image(overlay, caption="Grad-CAM Overlay", use_column_width=True)

    st.markdown("### 📋 All Class Probabilities")
    for i, prob in enumerate(probs):
        st.write(f"{class_names[i]}: {prob:.2%}")
