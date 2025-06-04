// main.js - Script para a página principal (desktop)
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const initialScreen = document.getElementById('initial-screen');
    const qrcodeScreen = document.getElementById('qrcode-screen');
    const filesScreen = document.getElementById('files-screen');
    const generateQrcodeBtn = document.getElementById('generate-qrcode');
    const newQrcodeBtn = document.getElementById('new-qrcode');
    const checkFilesBtn = document.getElementById('check-files');
    const backToQrcodeBtn = document.getElementById('back-to-qrcode');
    const qrcodeContainer = document.getElementById('qrcode-image');
    const sessionUrlText = document.getElementById('session-url');
    const filesList = document.getElementById('files-list');
    const noFilesMessage = document.getElementById('no-files-message');
    const downloadControls = document.getElementById('download-controls');
    const selectAllBtn = document.getElementById('select-all');
    const downloadSelectedBtn = document.getElementById('download-selected');
    const notificationToast = document.getElementById('notification-toast');
    const toastBody = notificationToast.querySelector('.toast-body');
    
    // Variáveis de estado
    let currentSessionId = null;
    let sessionFiles = [];
    let allSelected = false;
    
    // Inicializar o Socket.IO para comunicação em tempo real
    const socket = io();
    
    // Configurar o toast de notificação
    const toast = new bootstrap.Toast(notificationToast, {
        autohide: true,
        delay: 5000
    });
    
    // Mostrar notificação
    function showNotification(message) {
        toastBody.textContent = message;
        toast.show();
    }
    
    // Alternar entre as telas
    function showScreen(screen) {
        initialScreen.classList.add('d-none');
        qrcodeScreen.classList.add('d-none');
        filesScreen.classList.add('d-none');
        
        screen.classList.remove('d-none');
    }
    
    // Gerar um novo QR Code
    async function generateQRCode() {
        try {
            showScreen(qrcodeScreen);
            qrcodeContainer.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div>';
            sessionUrlText.textContent = 'Gerando QR Code...';
            checkFilesBtn.disabled = true;
            
            // Criar uma nova sessão no servidor
            const response = await fetch('/api/session/create', {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error('Erro ao criar sessão');
            }
            
            const data = await response.json();
            currentSessionId = data.session_id;
            
            // Obter o QR Code para a sessão
            const qrResponse = await fetch(`/api/session/qrcode/${currentSessionId}`);
            
            if (!qrResponse.ok) {
                throw new Error('Erro ao gerar QR Code');
            }
            
            const qrData = await qrResponse.json();
            
            // Exibir o QR Code
            if (qrData.qrcode_url) {
                // Usar URL da API externa se disponível
                qrcodeContainer.innerHTML = `<img src="${qrData.qrcode_url}" alt="QR Code" class="img-fluid">`;
            } else if (qrData.qrcode_base64) {
                // Usar imagem base64 gerada localmente
                qrcodeContainer.innerHTML = `<img src="${qrData.qrcode_base64}" alt="QR Code" class="img-fluid">`;
            } else {
                // Fallback final: exibir apenas a URL
                qrcodeContainer.innerHTML = `<div class="alert alert-warning">QR Code não disponível. Use a URL abaixo:</div>`;
            }
            
            sessionUrlText.textContent = qrData.upload_url;
            checkFilesBtn.disabled = false;
            
            // Entrar na sala do Socket.IO para esta sessão
            socket.emit('join_session', { session_id: currentSessionId });
            
            // Limpar a lista de arquivos anterior
            sessionFiles = [];
            
            showNotification('QR Code gerado com sucesso! Aguardando arquivos...');
        } catch (error) {
            console.error('Erro:', error);
            showNotification('Erro ao gerar QR Code. Tente novamente.');
            showScreen(initialScreen);
        }
    }
    
    // Verificar arquivos disponíveis na sessão
    async function checkFiles() {
        if (!currentSessionId) {
            showNotification('Sessão não encontrada. Gere um novo QR Code.');
            return;
        }
        
        try {
            const response = await fetch(`/api/session/files/${currentSessionId}`);
            
            if (!response.ok) {
                throw new Error('Erro ao obter arquivos');
            }
            
            const data = await response.json();
            sessionFiles = data.files || [];
            
            showScreen(filesScreen);
            renderFilesList();
        } catch (error) {
            console.error('Erro:', error);
            showNotification('Erro ao verificar arquivos. Tente novamente.');
        }
    }
    
    // Renderizar a lista de arquivos
    function renderFilesList() {
        filesList.innerHTML = '';
        
        if (sessionFiles.length === 0) {
            noFilesMessage.classList.remove('d-none');
            downloadControls.classList.add('d-none');
            return;
        }
        
        noFilesMessage.classList.add('d-none');
        downloadControls.classList.remove('d-none');
        
        sessionFiles.forEach((file, index) => {
            const fileExtension = file.original_filename.split('.').pop().toLowerCase();
            let iconClass = 'bi-file-earmark';
            
            // Determinar o ícone com base na extensão
            if (['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(fileExtension)) {
                iconClass = 'bi-file-earmark-image';
            } else if (fileExtension === 'pdf') {
                iconClass = 'bi-file-earmark-pdf';
            } else if (fileExtension === 'svg') {
                iconClass = 'bi-file-earmark-code';
            }
            
            // Formatar o tamanho do arquivo
            const fileSize = formatFileSize(file.size);
            
            // Criar o elemento de lista para o arquivo
            const listItem = document.createElement('div');
            listItem.className = 'list-group-item';
            listItem.innerHTML = `
                <div class="file-icon">
                    <i class="bi ${iconClass}"></i>
                </div>
                <div class="file-info">
                    <div class="file-name">${file.original_filename}</div>
                    <div class="file-meta">${fileSize} • ${formatDate(file.uploaded_at)}</div>
                </div>
                <div class="file-actions">
                    <input type="checkbox" class="file-checkbox" data-filename="${file.filename}">
                    <a href="/api/session/download/${currentSessionId}/${file.filename}" class="btn btn-sm btn-outline-primary ms-2" download="${file.original_filename}">
                        <i class="bi bi-download"></i>
                    </a>
                </div>
            `;
            
            filesList.appendChild(listItem);
        });
        
        // Adicionar eventos aos checkboxes
        document.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updateDownloadButtonState);
        });
    }
    
    // Atualizar o estado do botão de download com base nas seleções
    function updateDownloadButtonState() {
        const checkboxes = document.querySelectorAll('.file-checkbox');
        const checkedCount = document.querySelectorAll('.file-checkbox:checked').length;
        
        downloadSelectedBtn.disabled = checkedCount === 0;
        selectAllBtn.textContent = allSelected ? 'Desmarcar Todos' : 'Selecionar Todos';
    }
    
    // Selecionar ou desmarcar todos os arquivos
    function toggleSelectAll() {
        allSelected = !allSelected;
        
        document.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.checked = allSelected;
        });
        
        selectAllBtn.innerHTML = allSelected ? 
            '<i class="bi bi-square"></i> Desmarcar Todos' : 
            '<i class="bi bi-check-all"></i> Selecionar Todos';
        
        updateDownloadButtonState();
    }
    
    // Baixar os arquivos selecionados
    function downloadSelectedFiles() {
        const selectedFiles = Array.from(document.querySelectorAll('.file-checkbox:checked'))
            .map(checkbox => checkbox.getAttribute('data-filename'));
        
        if (selectedFiles.length === 0) {
            showNotification('Selecione pelo menos um arquivo para download.');
            return;
        }
        
        // Para cada arquivo selecionado, criar um link de download e clicar nele
        selectedFiles.forEach(filename => {
            const fileInfo = sessionFiles.find(file => file.filename === filename);
            if (fileInfo) {
                const link = document.createElement('a');
                link.href = `/api/session/download/${currentSessionId}/${filename}`;
                link.download = fileInfo.original_filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
        
        showNotification(`Iniciando download de ${selectedFiles.length} arquivo(s)...`);
    }
    
    // Formatar o tamanho do arquivo
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Formatar a data
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Eventos de clique
    generateQrcodeBtn.addEventListener('click', generateQRCode);
    newQrcodeBtn.addEventListener('click', generateQRCode);
    checkFilesBtn.addEventListener('click', checkFiles);
    backToQrcodeBtn.addEventListener('click', () => showScreen(qrcodeScreen));
    selectAllBtn.addEventListener('click', toggleSelectAll);
    downloadSelectedBtn.addEventListener('click', downloadSelectedFiles);
    
    // Eventos do Socket.IO
    socket.on('connect', () => {
        console.log('Conectado ao servidor Socket.IO');
    });
    
    socket.on('disconnect', () => {
        console.log('Desconectado do servidor Socket.IO');
    });
    
    socket.on('new_file', (data) => {
        if (data.session_id === currentSessionId) {
            showNotification('Novo arquivo recebido!');
            
            // Atualizar a lista de arquivos se estiver na tela de arquivos
            if (!filesScreen.classList.contains('d-none')) {
                checkFiles();
            } else {
                // Apenas notificar se estiver na tela do QR Code
                checkFilesBtn.classList.add('btn-primary');
                checkFilesBtn.classList.remove('btn-outline-primary');
                checkFilesBtn.innerHTML = '<i class="bi bi-cloud-download"></i> Novos Arquivos Disponíveis!';
            }
        }
    });
    
    // Iniciar na tela inicial
    showScreen(initialScreen);
});
