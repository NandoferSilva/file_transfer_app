# Manual de Instalação e Hospedagem da Aplicação de Transferência de Arquivos

Este manual detalha como instalar, configurar e hospedar a aplicação de transferência de arquivos entre smartphone e computador em diferentes ambientes.

## Índice

1. [Requisitos do Sistema](#requisitos-do-sistema)
2. [Opções de Hospedagem Gratuita](#opções-de-hospedagem-gratuita)
3. [Instalação Local](#instalação-local)
4. [Implantação em Servidores](#implantação-em-servidores)
   - [Render](#render)
   - [Railway](#railway)
   - [Heroku](#heroku)
   - [PythonAnywhere](#pythonanywhere)
5. [Configurações Adicionais](#configurações-adicionais)
6. [Solução de Problemas](#solução-de-problemas)

## Requisitos do Sistema

Para executar a aplicação, você precisará de:

- Python 3.8 ou superior
- Pip (gerenciador de pacotes Python)
- Git (opcional, para clonar o repositório)
- Acesso à internet (para integração com a API do QR Code Monkey)

## Opções de Hospedagem Gratuita

Existem várias opções gratuitas para hospedar esta aplicação:

### 1. Render (Recomendado)

**Vantagens:**
- Fácil integração com GitHub/GitLab
- Suporte nativo para aplicações Python/Flask
- Domínio personalizado gratuito
- 512MB RAM e 0.1 CPU gratuitos
- Implantação automática a partir de repositórios Git

**Limitações:**
- Aplicações gratuitas hibernam após 15 minutos de inatividade
- Limite de 750 horas de uso por mês

### 2. Railway

**Vantagens:**
- Interface simples e intuitiva
- Suporte para Python/Flask
- Implantação rápida
- Bom desempenho

**Limitações:**
- Crédito mensal limitado na versão gratuita
- Requer cartão de crédito para verificação

### 3. PythonAnywhere

**Vantagens:**
- Especializado em hospedagem Python
- Console Python no navegador
- Fácil configuração para Flask
- Não hiberna na versão gratuita

**Limitações:**
- Tráfego limitado na versão gratuita
- Domínio personalizado apenas em planos pagos

### 4. Heroku

**Vantagens:**
- Bem estabelecido e confiável
- Boa documentação
- Suporte para Python/Flask

**Limitações:**
- Versão gratuita limitada a 550 horas por mês
- Aplicações gratuitas hibernam após 30 minutos de inatividade

## Instalação Local

Siga estes passos para instalar e executar a aplicação em seu ambiente local:

1. **Clone ou baixe o código-fonte**

   ```bash
   git clone <url-do-repositorio>
   cd file_transfer_app
   ```

   Ou descompacte o arquivo ZIP baixado.

2. **Crie e ative um ambiente virtual**

   No Linux/macOS:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

   No Windows:
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Instale as dependências**

   ```bash
   pip install -r requirements.txt
   ```

4. **Execute a aplicação**

   ```bash
   python -m src.main
   ```

5. **Acesse a aplicação**

   Abra seu navegador e acesse `http://localhost:5000`

## Implantação em Servidores

### Render

1. **Crie uma conta no Render**
   - Acesse [render.com](https://render.com) e crie uma conta gratuita

2. **Crie um novo Web Service**
   - Clique em "New" e selecione "Web Service"
   - Conecte seu repositório Git ou faça upload do código

3. **Configure o serviço**
   - Nome: Escolha um nome para sua aplicação
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn src.main:app`
   - Adicione a variável de ambiente `PYTHON_VERSION` com valor `3.9` (ou superior)

4. **Implante o serviço**
   - Clique em "Create Web Service"
   - Aguarde a implantação (pode levar alguns minutos)

5. **Acesse sua aplicação**
   - Use a URL fornecida pelo Render (formato: `https://seu-app.onrender.com`)

### Railway

1. **Crie uma conta no Railway**
   - Acesse [railway.app](https://railway.app) e crie uma conta

2. **Crie um novo projeto**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub" ou "Empty Project"

3. **Configure o projeto**
   - Se escolher "Empty Project", adicione um serviço Python
   - Configure o comando de inicialização: `gunicorn src.main:app`
   - Adicione as variáveis de ambiente necessárias

4. **Implante a aplicação**
   - Conecte seu repositório ou faça upload do código
   - Railway detectará automaticamente o tipo de projeto

5. **Acesse sua aplicação**
   - Use a URL fornecida pelo Railway

### Heroku

1. **Crie uma conta no Heroku**
   - Acesse [heroku.com](https://heroku.com) e crie uma conta gratuita

2. **Instale o Heroku CLI**
   - Baixe e instale o [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

3. **Prepare sua aplicação**
   - Crie um arquivo `Procfile` na raiz do projeto com o conteúdo:
     ```
     web: gunicorn src.main:app
     ```
   - Certifique-se de que `requirements.txt` inclui `gunicorn`

4. **Implante no Heroku**
   ```bash
   heroku login
   heroku create seu-app-nome
   git push heroku main
   ```

5. **Acesse sua aplicação**
   - Use a URL fornecida pelo Heroku (formato: `https://seu-app-nome.herokuapp.com`)

### PythonAnywhere

1. **Crie uma conta no PythonAnywhere**
   - Acesse [pythonanywhere.com](https://www.pythonanywhere.com) e crie uma conta gratuita

2. **Faça upload do código**
   - Use a opção "Files" para fazer upload do código ou clone o repositório Git

3. **Configure um ambiente virtual**
   ```bash
   mkvirtualenv --python=/usr/bin/python3.9 myenv
   pip install -r requirements.txt
   ```

4. **Configure uma aplicação web**
   - Vá para a seção "Web" e clique em "Add a new web app"
   - Escolha "Manual configuration" e selecione Python 3.9
   - Configure o caminho para o ambiente virtual
   - Configure o arquivo WSGI para apontar para sua aplicação Flask

5. **Acesse sua aplicação**
   - Use a URL fornecida pelo PythonAnywhere (formato: `https://seu-username.pythonanywhere.com`)

## Configurações Adicionais

### Configuração do Socket.IO

Para garantir que o Socket.IO funcione corretamente em produção:

1. **Adicione um proxy WebSocket**
   - No Render, isso é configurado automaticamente
   - No Heroku, adicione o buildpack `heroku/python`
   - No Railway, nenhuma configuração adicional é necessária
   - No PythonAnywhere, você precisará de um plano pago para suporte a WebSockets

2. **Ajuste o código para produção**
   - Certifique-se de que o Socket.IO está configurado para funcionar com HTTPS:
   ```python
   socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent')
   ```

### Configuração de Domínio Personalizado

Para usar um domínio personalizado:

1. **Registre um domínio** (GoDaddy, Namecheap, etc.)
2. **Configure os registros DNS** para apontar para seu servidor
3. **Configure o domínio personalizado** no painel de controle do seu provedor de hospedagem

## Solução de Problemas

### Problemas com Socket.IO

Se a comunicação em tempo real não estiver funcionando:

1. Verifique se o WebSocket está habilitado no seu provedor
2. Certifique-se de que não há firewalls bloqueando as conexões WebSocket
3. Tente usar o modo de fallback do Socket.IO:
   ```python
   socketio = SocketIO(app, cors_allowed_origins="*", async_mode='polling')
   ```

### Problemas com Upload de Arquivos

Se o upload de arquivos não estiver funcionando:

1. Verifique os limites de tamanho de upload do seu provedor
2. Certifique-se de que as permissões de diretório estão corretas
3. Verifique se o diretório de uploads existe e tem permissões de escrita

### Problemas com QR Code

Se a geração de QR Code não estiver funcionando:

1. Verifique sua conexão com a API do QR Code Monkey
2. Use o fallback para geração local de QR Code:
   ```python
   import qrcode
   from io import BytesIO
   import base64
   
   def generate_qrcode_local(data):
       img = qrcode.make(data)
       buffered = BytesIO()
       img.save(buffered, format="PNG")
       img_str = base64.b64encode(buffered.getvalue()).decode()
       return f"data:image/png;base64,{img_str}"
   ```

---

Para qualquer dúvida adicional ou suporte, entre em contato através de [seu-email@exemplo.com].
