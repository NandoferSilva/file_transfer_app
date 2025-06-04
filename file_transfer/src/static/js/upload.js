// upload.js - Script para a página de upload (mobile)
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const uploadScreen = document.getElementById('upload-screen');
    const uploadProgressScreen = document.getElementById('upload-progress-screen');
    const uploadSuccessScreen = document.getElementById('upload-success-screen');
    const uploadErrorScreen = document.getElementById('upload-error-screen');
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const selectFilesBtn = document.getElementById('select-files-btn');
    const selectedFilesContainer = document.getElementById('selected-files-container');
    const selectedFilesList = document.getElementById('selected-files-list');
    const uploadFilesBtn = document.getElementById('upload-files-btn');
    const clearFilesBtn = document.getElementById('clear-files-btn');
    const uploadProgressBar = document.getElementById('upload-progress-bar');
    const uploadStatus = document.getElementById('upload-status');
    const errorMessage = document.getElementById('error-message');
    const sendMoreBtn = document.getElementById('send-more-btn');
    const tryAgainBtn = document.getElementById('try-again-btn');
    
    // Variáveis de estado
    let selectedFiles = [];
    let sessionId = null;
    
    // Inicializar o Socket.IO para comunicação em tempo real
    const socket = io();
    
    // Obter o ID da sessão da URL
    function getSessionIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }
    
    // Inicializar a página
    function init() {
        sessionId = getSessionIdFromUrl();
        
        if (!sessionId) {
            showError('Sessão não encontrada. Escaneie o QR Code novamente.');
            return;
        }
        
        // Verificar se a sessão existe
        fetch(`/api/session/files/${sessionId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Sessão inválida ou expirada');
                }
                return response.json();
            })
            .then(() => {
                // Sessão válida, continuar com a inicialização
                console.log('Sessão válida:', sessionId);
                
                // Entrar na sala do Socket.IO para esta sessão
                socket.emit('join_session', { session_id: sessionId });
            })
            .catch(error => {
                console.error('Erro:', error);
                showError('Sessão inválida ou expirada. Escaneie o QR Code novamente.');
            });
    }
    
    // Alternar entre as telas
    function showScreen(screen) {
        uploadScreen.classList.add('d-none');
        uploadProgressScreen.classList.add('d-none');
        uploadSuccessScreen.classList.add('d-none');
        uploadErrorScreen.classList.add('d-none');
        
        screen.classList.remove('d-none');
    }
    
    // Mostrar mensagem de erro
    function showError(message) {
        errorMessage.textContent = message;
        showScreen(uploadErrorScreen);
    }
    
    // Adicionar arquivos à seleção
    function addFiles(files) {
        const newFiles = Array.from(files).filter(file => {
            // Verificar se o arquivo já está na lista
            const isDuplicate = selectedFiles.some(f => 
                f.name === file.name && 
                f.size === file.size && 
                f.type === file.type
            );
            
            if (isDuplicate) {
                return false;
            }
            
            // Verificar o tipo de arquivo
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'svg', 'heic', 'bmp'];
            
            if (!allowedExtensions.includes(fileExtension)) {
                alert(`Formato não permitido: ${file.name}\nApenas PDF, JPG, JPEG, PNG, WEBP, SVG, HEIC e BMP são aceitos.`);
                return false;
            }
            
            // Verificar o tamanho do arquivo (30MB = 30 * 1024 * 1024 bytes)
            if (file.size > 30 * 1024 * 1024) {
                alert(`Arquivo muito grande: ${file.name}\nO tamanho máximo permitido é 30MB.`);
                return false;
            }
            
            return true;
        });
        
        if (newFiles.length === 0) {
            return;
        }
        
        // Adicionar os novos arquivos à lista
        selectedFiles = [...selectedFiles, ...newFiles];
        
        // Mostrar a lista de arquivos selecionados
        selectedFilesContainer.classList.remove('d-none');
        
        // Renderizar a lista de arquivos
        renderFilesList();
    }
    
    // Renderizar a lista de arquivos selecionados
    function renderFilesList() {
        selectedFilesList.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            let iconClass = 'bi-file-earmark';
            
            // Determinar o ícone com base na extensão
            if (['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(fileExtension)) {
                iconClass = 'bi-file-earmark-image';
            } else if (fileExtension === 'pdf') {
                iconClass = 'bi-file-earmark-pdf';
            } else if (fileExtension === 'svg') {
                iconClass = 'bi-file-earmark-code';
            }
            
            // Criar o elemento de lista para o arquivo
            const listItem = document.createElement('div');
            listItem.className = 'list-group-item d-flex align-items-center';
            listItem.innerHTML = `
                <div class="file-preview">
                    <i class="bi ${iconClass}"></i>
                </div>
                <div class="file-info flex-grow-1">
                    <div class="file-name text-truncate">${file.name}</div>
                    <div class="file-meta">
                        <span class="file-size-badge">${formatFileSize(file.size)}</span>
                    </div>
                </div>
                <button class="remove-file-btn" data-index="${index}">
                    <i class="bi bi-x-circle"></i>
                </button>
            `;
            
            selectedFilesList.appendChild(listItem);
        });
        
        // Adicionar eventos aos botões de remoção
        document.querySelectorAll('.remove-file-btn').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeFile(index);
            });
        });
        
        // Atualizar o estado do botão de upload
        uploadFilesBtn.disabled = selectedFiles.length === 0;
    }
    
    // Remover um arquivo da seleção
    function removeFile(index) {
        selectedFiles.splice(index, 1);
        
        if (selectedFiles.length === 0) {
            selectedFilesContainer.classList.add('d-none');
        }
        
        renderFilesList();
    }
    
    // Limpar todos os arquivos selecionados
    function clearFiles() {
        selectedFiles = [];
        selectedFilesContainer.classList.add('d-none');
        renderFilesList();
    }
    
    // Enviar os arquivos para o servidor
    async function uploadFiles() {
        if (selectedFiles.length === 0) {
            alert('Selecione pelo menos um arquivo para enviar.');
            return;
        }
        
        if (!sessionId) {
            showError('Sessão não encontrada. Escaneie o QR Code novamente.');
            return;
        }
        
        showScreen(uploadProgressScreen);
        uploadProgressBar.style.width = '0%';
        uploadStatus.textContent = 'Preparando arquivos...';
        
        try {
            const formData = new FormData();
            
            // Adicionar cada arquivo ao FormData
            selectedFiles.forEach(file => {
                formData.append('files[]', file);
            });
            
            // Configurar o XMLHttpRequest para acompanhar o progresso
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', function(event) {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    uploadProgressBar.style.width = percentComplete + '%';
                    uploadStatus.textContent = `Enviando... ${percentComplete}%`;
                }
            });
            
            xhr.addEventListener('load', function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = JSON.parse(xhr.responseText);
                    
                    if (response.success) {
                        // Notificar o computador sobre os novos arquivos
                        socket.emit('file_uploaded', {
                            session_id: sessionId,
                            files: response.uploaded_files
                        });
                        
                        showScreen(uploadSuccessScreen);
                    } else {
                        showError('Erro ao enviar arquivos: ' + (response.error || 'Erro desconhecido'));
                    }
                } else {
                    showError('Erro ao enviar arquivos. Código: ' + xhr.status);
                }
            });
            
            xhr.addEventListener('error', function() {
                showError('Erro de conexão. Verifique sua internet e tente novamente.');
            });
            
            xhr.addEventListener('abort', function() {
                showError('Envio cancelado.');
            });
            
            // Iniciar o upload
            xhr.open('POST', `/api/session/upload/${sessionId}`);
            xhr.send(formData);
            
        } catch (error) {
            console.error('Erro:', error);
            showError('Erro ao enviar arquivos: ' + error.message);
        }
    }
    
    // Formatar o tamanho do arquivo
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Eventos de clique
    selectFilesBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            addFiles(this.files);
            // Limpar o input para permitir selecionar o mesmo arquivo novamente
            this.value = '';
        }
    });
    
    uploadFilesBtn.addEventListener('click', uploadFiles);
    clearFilesBtn.addEventListener('click', clearFiles);
    sendMoreBtn.addEventListener('click', () => {
        clearFiles();
        showScreen(uploadScreen);
    });
    
    tryAgainBtn.addEventListener('click', () => {
        showScreen(uploadScreen);
    });
    
    // Eventos de arrastar e soltar
    dropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    dropArea.addEventListener('dragleave', function() {
        this.classList.remove('dragover');
    });
    
    dropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    });
    
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Eventos do Socket.IO
    socket.on('connect', () => {
        console.log('Conectado ao servidor Socket.IO');
    });
    
    socket.on('disconnect', () => {
        console.log('Desconectado do servidor Socket.IO');
    });
    
    // Inicializar a página
    init();
});
