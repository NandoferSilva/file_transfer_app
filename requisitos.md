# Requisitos e Fluxo da Aplicação de Transferência de Arquivos

## Requisitos Funcionais

### Usuário do Computador
1. Gerar QR Code para iniciar uma sessão de transferência
2. Visualizar arquivos enviados pelo usuário do smartphone
3. Selecionar um ou vários arquivos para download
4. Baixar os arquivos selecionados
5. Gerar novo QR Code para iniciar nova sessão (apagando arquivos anteriores)

### Usuário do Smartphone
1. Escanear QR Code gerado pelo usuário do computador
2. Acessar página de upload de arquivos
3. Selecionar arquivos para envio
4. Enviar arquivos selecionados para o usuário do computador

### Requisitos Técnicos
1. **Formatos de arquivo suportados**: PDF, JPG, JPEG, PNG, WEBP, SVG, HEIC, BMP
2. **Tamanho máximo por arquivo**: 30 MB
3. **Armazenamento**: Temporário (até geração de novo QR Code)
4. **Comunicação**: Via internet, sem necessidade de estarem na mesma rede
5. **Integração**: API do QR Code Monkey para geração de QR Codes
6. **Interface**: Responsiva e intuitiva (desktop e mobile)

## Fluxo da Aplicação

### Fluxo Principal
1. **Usuário do Computador**:
   - Acessa a aplicação web
   - Clica no botão "Gerar QR Code"
   - Sistema gera um QR Code único com ID de sessão
   - QR Code é exibido na tela

2. **Usuário do Smartphone**:
   - Escaneia o QR Code com a câmera
   - É redirecionado para a página de upload da aplicação
   - Seleciona arquivos para envio (respeitando formatos e tamanho)
   - Clica no botão "Enviar Arquivos"
   - Sistema transfere os arquivos para o servidor

3. **Usuário do Computador**:
   - Recebe notificação de arquivos recebidos
   - Visualiza lista de arquivos enviados
   - Seleciona arquivos desejados
   - Clica em "Baixar Selecionados" ou "Baixar Todos"
   - Sistema inicia o download dos arquivos selecionados

4. **Nova Sessão**:
   - Usuário do computador clica em "Gerar Novo QR Code"
   - Sistema limpa arquivos da sessão anterior
   - Novo QR Code é gerado para nova sessão

## Arquitetura Técnica

### Backend (Flask)
- Gerenciamento de sessões
- Armazenamento temporário de arquivos
- API para upload/download de arquivos
- Integração com QR Code Monkey
- Validação de arquivos (formato e tamanho)

### Frontend
- Interface responsiva (desktop e mobile)
- Página do computador (geração de QR Code e download)
- Página do smartphone (upload de arquivos)
- Feedback visual de progresso
- Validações de cliente

### Segurança
- Validação de tipos de arquivo
- Limite de tamanho de upload
- Expiração automática de sessões
- Limpeza de arquivos não utilizados

## Tecnologias Propostas
- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript (com frameworks modernos)
- **Armazenamento**: Sistema de arquivos temporário
- **Comunicação**: WebSockets para atualizações em tempo real
- **Integração**: API REST para QR Code Monkey
