# Task 4: Run LLM for Prelabeling

## Overview
This task demonstrates how to set up and use Label Studio with a Machine Learning backend for text classification with LLM-based prelabeling.

## Objective
- Set up ML backend and connect to Label Studio
- Create a text classification task
- Run LLM service for automatic prelabeling
- Demonstrate the complete workflow from setup to prediction

## Implementation Steps
1. **Read Documentation**: Studied https://labelstud.io/guide/ml to understand Label Studio ML backend integration
2. **Setup ML Backend**: Configured and started the ML backend service locally
3. **Create Classification Task**: Defined a text classification task in Label Studio
4. **Connect Model**: Hooked the ML backend to Label Studio project
5. **Run Prelabeling**: Used LLM service to automatically generate predictions

## Deliverables

### 1. Connect Model Screenshot
**File**: `connect model.png`
- Screenshot showing the "Connect Model" page with service URL configured
- Demonstrates successful connection between Label Studio and ML backend

### 2. Model Prediction Screenshot  
**File**: `Screenshot model did the prediction .png`
- Screenshot showing the model successfully making predictions
- Displays the LLM-generated prelabels in the annotation interface

### 3. Task Data Package
**File**: `source data and label.zip`
- Contains the complete task setup including:
  - Source data used for the text classification task
  - Label configuration
  - Any additional task-related files

## Technical Details
- **Task Type**: Text Classification
- **ML Backend**: Local LLM service 
- **Integration**: Label Studio ML SDK
- **Workflow**: Data Import → Model Connection → Automatic Prelabeling

## Results
✅ Successfully set up ML backend integration  
✅ Created functional text classification task  
✅ Established connection between Label Studio and ML service  
✅ Demonstrated automatic prelabeling with LLM predictions  

This implementation shows the complete end-to-end workflow of using Label Studio with machine learning models for automated data annotation and prelabeling.
