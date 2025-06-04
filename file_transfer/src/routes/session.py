import os
import uuid
import json
import requests
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from src.models.session import Session
from werkzeug.utils import secure_filename

session_bp = Blueprint('session', __name__)

# Inicializa o sistema de sessões
Session.initialize()

@session_bp.route('/create', methods=['POST'])
def create_session():
    """
    Cria uma nova sessão para transferência de arquivos.
    Retorna o ID da sessão criada.
    """
    session_id = Session.create_session()
    return jsonify({
        'success': True,
        'session_id': session_id
    }), 201

@session_bp.route('/qrcode/<session_id>', methods=['GET'])
def generate_qrcode(session_id):
    """
    Gera um QR Code para a sessão especificada.
    Tenta usar a API do QR Code Monkey primeiro, com fallback para geração local.
    """
    import qrcode
    import base64
    from io import BytesIO
    
    # Verifica se a sessão existe
    session = Session.get_session(session_id)
    if not session:
        return jsonify({
            'success': False,
            'error': 'Sessão não encontrada'
        }), 404
    
    # URL para a página de upload (será escaneada pelo smartphone)
    upload_url = request.host_url.rstrip('/') + f'/upload/{session_id}'
    
    # Função para gerar QR Code localmente
    def generate_qrcode_local(data):
        img = qrcode.make(data)
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        return f"data:image/png;base64,{img_str}"
    
    # Primeiro tenta usar a API do QR Code Monkey
    try:
        # Parâmetros para a API do QR Code Monkey
        qr_data = {
            'data': upload_url,
            'size': 300,
            'config': {
                'body': 'square',
                'eye': 'frame0',
                'eyeBall': 'ball0',
                'bodyColor': '#1A73E8',
                'bgColor': '#FFFFFF',
                'eye1Color': '#1A73E8',
                'eye2Color': '#1A73E8',
                'eye3Color': '#1A73E8',
                'eyeBall1Color': '#1A73E8',
                'eyeBall2Color': '#1A73E8',
                'eyeBall3Color': '#1A73E8',
                'logo': '',
            }
        }
        
        # Chamada para a API do QR Code Monkey
        response = requests.post(
            'https://api.qrcode-monkey.com/qr/custom',
            json=qr_data,
            headers={'Content-Type': 'application/json'},
            timeout=3  # Timeout de 3 segundos para não bloquear por muito tempo
        )
        
        if response.status_code == 200 and 'imageUrl' in response.json():
            return jsonify({
                'success': True,
                'qrcode_url': response.json().get('imageUrl'),
                'qrcode_base64': None,  # API externa funcionou, não precisa de base64
                'session_id': session_id,
                'upload_url': upload_url
            })
        else:
            # API falhou, usar geração local
            raise Exception("API externa não retornou URL válida")
            
    except Exception as e:
        # Fallback: gerar QR Code localmente
        qrcode_base64 = generate_qrcode_local(upload_url)
        
        return jsonify({
            'success': True,
            'qrcode_url': None,  # Sem URL externa
            'qrcode_base64': qrcode_base64,  # QR Code em base64
            'session_id': session_id,
            'upload_url': upload_url
        })

@session_bp.route('/upload/<session_id>', methods=['POST'])
def upload_file(session_id):
    """
    Recebe arquivos enviados pelo smartphone e os armazena na sessão.
    """
    # Verifica se a sessão existe
    session = Session.get_session(session_id)
    if not session:
        return jsonify({
            'success': False,
            'error': 'Sessão não encontrada'
        }), 404
    
    # Verifica se há arquivos na requisição
    if 'files[]' not in request.files:
        return jsonify({
            'success': False,
            'error': 'Nenhum arquivo enviado'
        }), 400
    
    files = request.files.getlist('files[]')
    uploaded_files = []
    errors = []
    
    for file in files:
        if file.filename == '':
            continue
        
        # Verifica se o arquivo tem uma extensão permitida
        if not Session.is_allowed_file(file.filename):
            errors.append(f'Formato não permitido: {file.filename}')
            continue
        
        # Verifica o tamanho do arquivo
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > Session.MAX_FILE_SIZE:
            errors.append(f'Arquivo muito grande: {file.filename}')
            continue
        
        # Gera um nome seguro para o arquivo
        original_filename = file.filename
        filename = secure_filename(original_filename)
        # Adiciona um UUID para evitar colisões de nomes
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        
        # Salva o arquivo no diretório da sessão
        file_path = os.path.join(session['directory'], unique_filename)
        file.save(file_path)
        
        # Adiciona o arquivo à sessão
        file_info = Session.add_file(session_id, unique_filename, original_filename)
        uploaded_files.append(file_info)
    
    return jsonify({
        'success': True,
        'uploaded_files': uploaded_files,
        'errors': errors
    })

@session_bp.route('/files/<session_id>', methods=['GET'])
def get_files(session_id):
    """
    Retorna a lista de arquivos disponíveis na sessão.
    """
    # Verifica se a sessão existe
    session = Session.get_session(session_id)
    if not session:
        return jsonify({
            'success': False,
            'error': 'Sessão não encontrada'
        }), 404
    
    files = Session.get_files(session_id)
    return jsonify({
        'success': True,
        'files': files
    })

@session_bp.route('/download/<session_id>/<filename>', methods=['GET'])
def download_file(session_id, filename):
    """
    Permite o download de um arquivo específico da sessão.
    """
    # Verifica se a sessão existe
    session = Session.get_session(session_id)
    if not session:
        return jsonify({
            'success': False,
            'error': 'Sessão não encontrada'
        }), 404
    
    # Verifica se o arquivo existe na sessão
    file_exists = False
    original_filename = filename
    
    for file_info in session['files']:
        if file_info['filename'] == filename:
            original_filename = file_info['original_filename']
            file_exists = True
            break
    
    if not file_exists:
        return jsonify({
            'success': False,
            'error': 'Arquivo não encontrado'
        }), 404
    
    return send_from_directory(
        session['directory'],
        filename,
        as_attachment=True,
        download_name=original_filename
    )

@session_bp.route('/delete/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """
    Remove uma sessão e todos os seus arquivos.
    """
    success = Session.delete_session(session_id)
    if success:
        return jsonify({
            'success': True,
            'message': 'Sessão removida com sucesso'
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Sessão não encontrada'
        }), 404
