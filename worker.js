addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // 移除开头的斜杠获取实际路径
  const path = url.pathname.replace(/^\//, '')
  
  // 检测请求头和爬虫特征
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''
  
  // 添加调试模式：在URL中加入 ?debug=1 可查看User-Agent
  if (url.searchParams.get('debug') === '1') {
    return new Response(`Debug Info:\n\nUser-Agent: ${userAgent}\n\nPath: ${path}\nPath Length: ${path.length}`, {
      headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
    })
  }
  
  // 检测安全扫描器和爬虫的特征（跳过正常移动浏览器）
  if (isSecurityScanner(userAgent) && !isMobileBrowser(userAgent)) {
    return generateFakePage()
  }
  
  // 处理图片请求 - 从GitHub加载LOGO
  if (path === 'x.png') {
    try {
      const imageResponse = await fetch('https://raw.githubusercontent.com/SLOMEDIALLC/moboreels/main/x.png');
      
      if (!imageResponse.ok) {
        return new Response('Image not found', { status: 404 });
      }
      
      return new Response(imageResponse.body, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response('Image not found: ' + error.message, { status: 404 });
    }
  }
  
  // 如果是根路径访问，返回403
  if (path === '') {
    return new Response('Access Denied', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  }

  // 处理APK下载请求 - 添加验证和混淆
  if (path === 'moboreels.apk') {
    try {
      const response = await fetch('https://raw.githubusercontent.com/SLOMEDIALLC/moboreels/main/moboreels.apk');
      
      if (!response.ok) {
        return new Response('APK file not found', { status: 404 });
      }
      
      // 添加安全相关的响应头
      return new Response(response.body, {
        headers: {
          'content-type': 'application/vnd.android.package-archive',
          'content-disposition': 'attachment; filename="app_' + generateRandomString(6) + '.apk"',
          'x-content-type-options': 'nosniff',
          'cache-control': 'private, max-age=0, no-store, no-cache, must-revalidate',
          'pragma': 'no-cache'
        }
      });
    } catch (error) {
      return new Response('File not found: ' + error.message, { status: 404 });
    }
  }

  // 如果路径不是恰好8个字符，返回403
  if (path.length !== 8) {
    return new Response('Access Denied', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  }

  // 返回混淆后的HTML内容
  const html = generateHtmlContent()
  
  // 添加安全相关的响应头
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'X-XSS-Protection': '1; mode=block',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    }
  })
}

// 检测是否为正常的手机浏览器
function isMobileBrowser(userAgent) {
  const mobileBrowsers = [
    'iPhone', 'iPad', 'iPod', 'Android', 'Mobile', 'BlackBerry', 
    'Opera Mini', 'IEMobile', 'Windows Phone', 'Safari', 'Chrome'
  ]
  
  const lowerUA = userAgent.toLowerCase()
  return mobileBrowsers.some(pattern => lowerUA.includes(pattern.toLowerCase()))
}

// 检测安全扫描器和爬虫
function isSecurityScanner(userAgent) {
  const scannerPatterns = [
    'googlebot', 'bingbot', 'yandex', 'baiduspider', 'facebookexternalhit',
    'twitterbot', 'rogerbot', 'linkedinbot', 'embedly', 'quora link preview',
    'showyoubot', 'outbrain', 'pinterest', 'slackbot', 'vkShare', 'W3C_Validator',
    'bingpreview', 'bitlybot', 'TelegramBot', 'Google-Safety', 'Googlebot',
    'AdsBot-Google', 'chrome-lighthouse', 'HeadlessChrome', 'CheckMarkNetwork',
    'Xenu Link Sleuth', 'SecurityScanner', 'Virus', 'MSIE 6.0', 'Scrapy', 'PhantomJS'
  ]
  
  const lowerUA = userAgent.toLowerCase()
  return scannerPatterns.some(pattern => lowerUA.includes(pattern.toLowerCase()))
}

// 生成假页面以迷惑扫描器
function generateFakePage() {
  const fakeHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>File Server</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #333; }
    .files { margin-top: 20px; }
    .file { padding: 10px; border-bottom: 1px solid #eee; }
  </style>
</head>
<body>
  <h1>Index of /files</h1>
  <div class="files">
    <div class="file">documents/</div>
    <div class="file">images/</div>
    <div class="file">readme.txt</div>
  </div>
</body>
</html>
  `
  
  return new Response(fakeHtml, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8'
    }
  })
}

// 生成下载验证页面
function getDownloadVerificationPage(origin) {
  const timestamp = Date.now()
  const token = generateRandomString(16)
  
  const verificationHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Download Verification</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
    h1 { color: #333; }
    .btn { 
      display: inline-block; 
      padding: 10px 20px; 
      background: #4CAF50; 
      color: white; 
      text-decoration: none; 
      border-radius: 4px; 
      margin-top: 20px; 
    }
  </style>
</head>
<body>
  <h1>Download Verification</h1>
  <p>Please click the button below to start your download</p>
  <a href="#" class="btn" id="download-btn">Start Download</a>
  
  <script>
    document.getElementById('download-btn').addEventListener('click', function(e) {
      e.preventDefault();
      
      // 创建带验证信息的请求
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '${origin}/moboreels.apk');
      xhr.responseType = 'blob';
      xhr.setRequestHeader('x-download-token', '${token}');
      xhr.setRequestHeader('x-timestamp', '${timestamp}');
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          // 创建下载链接
          const blob = new Blob([xhr.response], {type: 'application/vnd.android.package-archive'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'app_${generateRandomString(6)}.apk';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      };
      
      xhr.send();
    });
  </script>
</body>
</html>
  `
  
  return new Response(verificationHtml, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8'
    }
  })
}

// 生成混淆后的HTML内容
function generateHtmlContent() {
  // 基本的HTML模板
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MoboReels - Dramas Curtos</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        
        body {
            background: linear-gradient(180deg, #001a0f 0%, #002d1a 30%, #00472d 60%, #002d1a 90%, #001a0f 100%);
            color: white;
            min-height: 100vh;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            overflow-x: hidden;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at 50% 50%, rgba(0, 151, 57, 0.15) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
        }
        
        html {
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }

        /* 短剧主题背景动画 */
        .slot-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            opacity: 0.08;
            pointer-events: none;
            overflow: hidden;
        }

        /* 电影胶片条纹 */
        .film-strip {
            position: absolute;
            width: 60px;
            height: 200%;
            background: repeating-linear-gradient(
                0deg,
                rgba(0, 151, 57, 0.3) 0px,
                rgba(0, 151, 57, 0.3) 20px,
                transparent 20px,
                transparent 40px,
                rgba(255, 215, 0, 0.3) 40px,
                rgba(255, 215, 0, 0.3) 60px,
                transparent 60px,
                transparent 80px
            );
            animation: filmScroll 8s linear infinite;
        }

        .film-strip:nth-child(1) { left: 10%; }
        .film-strip:nth-child(2) { left: 30%; animation-duration: 10s; }
        .film-strip:nth-child(3) { left: 50%; animation-duration: 12s; }
        .film-strip:nth-child(4) { left: 70%; animation-duration: 9s; }
        .film-strip:nth-child(5) { left: 90%; animation-duration: 11s; }

        @keyframes filmScroll {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
        }

        /* 播放按钮图标 */
        .play-icon {
            position: absolute;
            width: 0;
            height: 0;
            border-left: 30px solid rgba(0, 168, 89, 0.4);
            border-top: 20px solid transparent;
            border-bottom: 20px solid transparent;
            animation: floatPlay 6s ease-in-out infinite;
        }

        .play-icon:nth-child(6) { top: 15%; left: 15%; animation-delay: 0s; }
        .play-icon:nth-child(7) { top: 45%; left: 80%; animation-delay: 2s; }
        .play-icon:nth-child(8) { top: 75%; left: 25%; animation-delay: 4s; }

        @keyframes floatPlay {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
            50% { transform: translateY(-30px) scale(1.2); opacity: 0.6; }
        }

        /* 短剧文字 */
        .drama-text {
            position: absolute;
            font-size: 24px;
            font-weight: 700;
            color: rgba(255, 215, 0, 0.4);
            animation: textFloat 8s ease-in-out infinite;
            white-space: nowrap;
        }

        .drama-text:nth-child(9) { top: 20%; left: 60%; animation-delay: 0s; }
        .drama-text:nth-child(10) { top: 55%; left: 40%; animation-delay: 3s; }
        .drama-text:nth-child(11) { top: 85%; left: 70%; animation-delay: 6s; }

        @keyframes textFloat {
            0%, 100% { transform: translateX(0) translateY(0); opacity: 0.2; }
            50% { transform: translateX(20px) translateY(-20px); opacity: 0.5; }
        }

        /* 闪烁光效 */
        .sparkle {
            position: fixed;
            width: 3px;
            height: 3px;
            background: linear-gradient(45deg, #00a859, #ffd700);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1;
            animation: sparkle 2s ease-in-out infinite;
            box-shadow: 0 0 10px rgba(0, 168, 89, 0.8);
        }

        @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
        }

        .container {
            max-width: 480px;
            width: 100%;
            text-align: center;
            margin: 0 auto;
            padding: 30px 20px;
            position: relative;
            z-index: 2;
            background: linear-gradient(135deg, rgba(0, 30, 20, 0.6) 0%, rgba(0, 20, 15, 0.8) 100%);
            border-radius: 30px;
            backdrop-filter: blur(20px);
            box-shadow: 0 20px 60px rgba(0, 151, 57, 0.25), 0 0 1px rgba(255, 255, 255, 0.1) inset;
            border: 1px solid rgba(0, 168, 89, 0.3);
        }

        .logo-container {
            width: 140px;
            height: 140px;
            margin: 20px auto 30px;
            border-radius: 32px;
            box-shadow: 0 10px 40px rgba(0, 168, 89, 0.5), 0 0 80px rgba(255, 215, 0, 0.3);
            background: linear-gradient(135deg, rgba(0, 151, 57, 0.25) 0%, rgba(255, 215, 0, 0.2) 100%);
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid rgba(0, 168, 89, 0.6);
            position: relative;
            animation: logoGlow 3s ease-in-out infinite;
        }
        
        @keyframes logoGlow {
            0%, 100% {
                box-shadow: 0 10px 40px rgba(0, 168, 89, 0.5), 0 0 80px rgba(255, 215, 0, 0.3);
            }
            50% {
                box-shadow: 0 10px 50px rgba(0, 168, 89, 0.7), 0 0 100px rgba(255, 215, 0, 0.5);
            }
        }

        .logo {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        h1 {
            font-size: 32px;
            margin-bottom: 15px;
            background: linear-gradient(135deg, #00c853 0%, #ffd700 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
            letter-spacing: 1px;
        }

        .description {
            font-size: 15px;
            line-height: 1.7;
            color: #d1d5db;
            margin-bottom: 30px;
            padding: 0 10px;
            font-weight: 400;
        }

        .download-btn {
            background: linear-gradient(135deg, #009739 0%, #ffd700 100%);
            background-size: 200% 200%;
            color: #ffffff;
            padding: 18px 50px;
            border-radius: 50px;
            text-decoration: none;
            font-size: 18px;
            font-weight: 700;
            display: inline-block;
            margin: 20px 0;
            box-shadow: 0 10px 30px rgba(0, 151, 57, 0.6), 0 0 40px rgba(255, 215, 0, 0.4);
            transition: all 0.3s ease;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            animation: buttonGlow 3s ease-in-out infinite;
            border: none;
            position: relative;
            overflow: hidden;
        }
        
        .download-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: left 0.5s;
        }
        
        .download-btn:hover::before {
            left: 100%;
        }

        @keyframes buttonGlow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        .download-btn:active {
            transform: scale(0.95);
            box-shadow: 0 5px 20px rgba(0, 151, 57, 0.7);
        }

        .features {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 35px 0 25px;
            padding: 0 5px;
        }

        .feature {
            background: linear-gradient(135deg, rgba(0, 151, 57, 0.15) 0%, rgba(255, 215, 0, 0.1) 100%);
            padding: 20px 15px;
            border-radius: 20px;
            text-align: center;
            border: 1px solid rgba(0, 168, 89, 0.35);
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }

        .feature:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 151, 57, 0.4);
            border-color: rgba(0, 168, 89, 0.6);
            background: linear-gradient(135deg, rgba(0, 151, 57, 0.25) 0%, rgba(255, 215, 0, 0.15) 100%);
        }

        .feature h3 {
            font-size: 16px;
            background: linear-gradient(135deg, #00c853 0%, #ffd700 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
            font-weight: 700;
        }

        .feature p {
            color: #d1d5db;
            font-size: 13px;
            line-height: 1.5;
        }

        .version {
            color: #9ca3af;
            font-size: 13px;
            margin-top: 20px;
            opacity: 0.7;
        }

        @media (max-width: 480px) {
            .features {
                grid-template-columns: 1fr;
            }
            
            .description {
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <!-- 短剧主题背景动画 -->
    <div class="slot-background">
        <!-- 电影胶片条纹 -->
        <div class="film-strip"></div>
        <div class="film-strip"></div>
        <div class="film-strip"></div>
        <div class="film-strip"></div>
        <div class="film-strip"></div>
        
        <!-- 播放按钮图标 -->
        <div class="play-icon"></div>
        <div class="play-icon"></div>
        <div class="play-icon"></div>
        
        <!-- 短剧文字 -->
        <div class="drama-text">DRAMA</div>
        <div class="drama-text">SÉRIES</div>
        <div class="drama-text">REELS</div>
    </div>

    <div class="container">
        <div class="logo-container">
            <img src="/x.png" class="logo" alt="MoboReels logo" onerror="this.style.display='none'">
        </div>
        <h1>MoboReels</h1>
        <p class="description">Bem-vindo ao MoboReels - Sua plataforma exclusiva de dramas curtos! Assista milhares de séries emocionantes, histórias de romance, suspense e comédia. Conteúdo em alta definição, atualizado diariamente. Entretenimento ilimitado na palma da sua mão. Baixe agora e mergulhe no mundo dos dramas!</p>
        
        <a href="/moboreels.apk" class="download-btn" id="download-link">
            Baixar Agora
        </a>

        <div class="features">
            <div class="feature">
                <h3>Conteúdo Ilimitado</h3>
                <p>Milhares de dramas curtos exclusivos</p>
            </div>
            <div class="feature">
                <h3>Streaming HD</h3>
                <p>Qualidade de vídeo em alta definição</p>
            </div>
            <div class="feature">
                <h3>Atualização Diária</h3>
                <p>Novos episódios todos os dias</p>
            </div>
            <div class="feature">
                <h3>Sem Anúncios</h3>
                <p>Assista sem interrupções</p>
            </div>
        </div>
        
        <p class="version">Versão 3.0.1</p>
    </div>

    <script>
        // 简单的内容混淆和反爬虫机制
        (function() {
            // 生成闪烁光效
            function createSparkles() {
                for (let i = 0; i < 20; i++) {
                    setTimeout(() => {
                        const sparkle = document.createElement('div');
                        sparkle.className = 'sparkle';
                        sparkle.style.left = Math.random() * 100 + '%';
                        sparkle.style.top = Math.random() * 100 + '%';
                        sparkle.style.animationDelay = Math.random() * 2 + 's';
                        document.body.appendChild(sparkle);
                        
                        setTimeout(() => sparkle.remove(), 4000);
                    }, i * 200);
                }
            }
            
            // 持续生成光效
            createSparkles();
            setInterval(createSparkles, 4000);
            
            // 检测是否为爬虫
            function detectBot() {
                const botPatterns = [
                    'googlebot', 'bingbot', 'yandex', 'baiduspider', 'facebookexternalhit',
                    'twitterbot', 'rogerbot', 'linkedinbot', 'embedly', 'quora link preview',
                    'showyoubot', 'outbrain', 'pinterest', 'slackbot', 'vkShare', 'W3C_Validator'
                ];
                
                const userAgent = navigator.userAgent.toLowerCase();
                return botPatterns.some(pattern => userAgent.indexOf(pattern) !== -1);
            }
            
            // 如果检测到爬虫，修改页面内容
            if (detectBot()) {
                document.title = "File Directory";
                document.body.innerHTML = "<h1>Index of /files</h1><p>Access Denied</p>";
                return;
            }
            
            // 添加下载按钮事件
            document.getElementById('download-link').addEventListener('click', function(e) {
                e.preventDefault();
                
                // 生成时间戳和token：这里不再真正生成 token，而是直接跳转到 APK 地址，避免部分浏览器拦截
                // 创建请求：不再使用 XMLHttpRequest 下载，直接让浏览器处理下载，提高兼容性
                // 创建下载链接：浏览器会自动处理下载并显示进度
                // Download failed with status: 逻辑交由浏览器自身处理
                // Download request failed: 逻辑交由浏览器自身处理
                window.location.href = '/moboreels.apk';
            });
            
            // 添加蜜罐链接 (对爬虫可见，对用户不可见)
            const honeyPot = document.createElement('a');
            honeyPot.href = '/admin/login';
            honeyPot.style.opacity = '0';
            honeyPot.style.position = 'absolute';
            honeyPot.style.pointerEvents = 'none';
            document.body.appendChild(honeyPot);
            
            // 监测调试工具（仅在桌面设备上启用）
            function detectDevTools() {
                // 检测是否为移动设备
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                // 移动设备跳过检测
                if (isMobile) return;
                
                const widthThreshold = window.outerWidth - window.innerWidth > 200;
                const heightThreshold = window.outerHeight - window.innerHeight > 200;
                
                if (widthThreshold || heightThreshold) {
                    document.body.innerHTML = "<h1>Access Denied</h1>";
                }
            }
            
            // 只在非移动设备上启用检测
            if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                window.addEventListener('resize', detectDevTools);
                setInterval(detectDevTools, 1000);
            }
        })();
    </script>
</body>
</html>
  `;
  
  return html;
}

// 生成随机字符串
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}
