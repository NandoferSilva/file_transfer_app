import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_socketio import SocketIO
from src.models.session import Session
from src.routes.session import session_bp

# Inicializa a aplicação Flask
app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
app.config['MAX_CONTENT_LENGTH'] = 30 * 1024 * 1024  # Limite de 30MB para uploads

# Inicializa o SocketIO para comunicação em tempo real
socketio = SocketIO(app, cors_allowed_origins="*")

# Registra os blueprints
app.register_blueprint(session_bp, url_prefix='/api/session')

# Inicializa o sistema de sessões
Session.initialize()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

# Rota específica para a página de upload (acessada pelo smartphone via QR Code)
@app.route('/upload/<session_id>')
def upload_page(session_id):
    # Verifica se a sessão existe
    session = Session.get_session(session_id)
    if not session:
        return "Sessão não encontrada ou expirada", 404
    
    # Retorna a página de upload
    upload_path = os.path.join(app.static_folder, 'upload.html')
    if os.path.exists(upload_path):
        return send_from_directory(app.static_folder, 'upload.html')
    else:
        return "Página de upload não encontrada", 404

# Eventos SocketIO para comunicação em tempo real
@socketio.on('connect')
def handle_connect():
    print('Cliente conectado')

@socketio.on('disconnect')
def handle_disconnect():
    print('Cliente desconectado')

@socketio.on('join_session')
def handle_join_session(data):
    """
    Cliente se junta a uma sala específica para a sessão.
    Isso permite notificações em tempo real para essa sessão.
    """
    session_id = data.get('session_id')
    if session_id:
        socketio.join_room(session_id)
        print(f'Cliente entrou na sessão: {session_id}')

@socketio.on('file_uploaded')
def handle_file_uploaded(data):
    """
    Notifica todos os clientes na sessão que um novo arquivo foi enviado.
    """
    session_id = data.get('session_id')
    if session_id:
        socketio.emit('new_file', data, room=session_id)
        print(f'Novo arquivo enviado para sessão: {session_id}')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
