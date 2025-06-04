import os
import uuid
import time
import shutil
from datetime import datetime

class Session:
    """
    Classe para gerenciar sessões de transferência de arquivos.
    Cada sessão tem um ID único e um diretório temporário para armazenar arquivos.
    """
    
    # Diretório base para armazenamento de arquivos de todas as sessões
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    
    # Formatos de arquivo permitidos
    ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'webp', 'svg', 'heic', 'bmp'}
    
    # Tamanho máximo de arquivo (30MB em bytes)
    MAX_FILE_SIZE = 30 * 1024 * 1024
    
    # Dicionário para armazenar todas as sessões ativas
    active_sessions = {}
    
    @classmethod
    def initialize(cls):
        """Inicializa o sistema de sessões, criando o diretório de uploads se necessário."""
        if not os.path.exists(cls.UPLOAD_FOLDER):
            os.makedirs(cls.UPLOAD_FOLDER)
    
    @classmethod
    def create_session(cls):
        """
        Cria uma nova sessão com ID único e diretório para arquivos.
        Retorna o ID da sessão criada.
        """
        session_id = str(uuid.uuid4())
        session_dir = os.path.join(cls.UPLOAD_FOLDER, session_id)
        
        # Cria o diretório da sessão
        os.makedirs(session_dir, exist_ok=True)
        
        # Registra a sessão no dicionário de sessões ativas
        cls.active_sessions[session_id] = {
            'created_at': datetime.now(),
            'files': [],
            'directory': session_dir
        }
        
        return session_id
    
    @classmethod
    def get_session(cls, session_id):
        """
        Obtém informações de uma sessão pelo ID.
        Retorna None se a sessão não existir.
        """
        return cls.active_sessions.get(session_id)
    
    @classmethod
    def add_file(cls, session_id, filename, original_filename):
        """
        Adiciona um arquivo à lista de arquivos da sessão.
        """
        if session_id in cls.active_sessions:
            file_info = {
                'filename': filename,
                'original_filename': original_filename,
                'uploaded_at': datetime.now(),
                'size': os.path.getsize(os.path.join(cls.UPLOAD_FOLDER, session_id, filename))
            }
            cls.active_sessions[session_id]['files'].append(file_info)
            return file_info
        return None
    
    @classmethod
    def get_files(cls, session_id):
        """
        Obtém a lista de arquivos de uma sessão.
        """
        session = cls.get_session(session_id)
        if session:
            return session['files']
        return []
    
    @classmethod
    def delete_session(cls, session_id):
        """
        Remove uma sessão e todos os seus arquivos.
        """
        session = cls.get_session(session_id)
        if session:
            # Remove o diretório da sessão e todos os arquivos
            session_dir = session['directory']
            if os.path.exists(session_dir):
                shutil.rmtree(session_dir)
            
            # Remove a sessão do dicionário de sessões ativas
            del cls.active_sessions[session_id]
            return True
        return False
    
    @classmethod
    def is_allowed_file(cls, filename):
        """
        Verifica se o arquivo tem uma extensão permitida.
        """
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in cls.ALLOWED_EXTENSIONS
    
    @classmethod
    def clean_old_sessions(cls, max_age_hours=24):
        """
        Remove sessões antigas que não foram usadas por um determinado período.
        """
        current_time = datetime.now()
        sessions_to_delete = []
        
        for session_id, session_data in cls.active_sessions.items():
            age = current_time - session_data['created_at']
            if age.total_seconds() > max_age_hours * 3600:
                sessions_to_delete.append(session_id)
        
        for session_id in sessions_to_delete:
            cls.delete_session(session_id)
