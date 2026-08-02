<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Transcript Extractor & Translator | Premium ToolVerse</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        /* VVIP Specific Styles for Transcript Tool */
        .extractor-container { max-width: 1200px; margin: 40px auto; padding: 0 20px; display: grid; grid-template-columns: 1fr 1.5fr; gap: 30px; }
        .input-card { background: #fff; padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #eaeaea; align-self: start; }
        .output-card { background: #0f172a; padding: 30px; border-radius: 16px; color: #f8fafc; box-shadow: 0 15px 40px rgba(0,0,0,0.15); position: relative; }
        .output-card h3 { color: #a78bfa; margin-top: 0; font-size: 1.2rem; border-bottom: 1px solid #1e293b; padding-bottom: 15px; }
        
        .transcript-content { 
            font-family: 'Courier New', Courier, monospace; 
            line-height: 1.8; 
            font-size: 15px; 
            margin-top: 20px; 
            white-space: pre-wrap; 
            height: 450px; 
            overflow-y: auto; 
            color: #e2e8f0; 
            background: #1e293b; 
            padding: 20px; 
            border-radius: 12px; 
            border: 1px solid #334155;
            direction: auto;
        }
        
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #334155; font-size: 14px;}
        .form-group input, .form-group select { width: 100%; padding: 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-family: inherit; font-size: 15px; background: #fff;}
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1); }
        
        .premium-btn { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; border: none; padding: 15px; width: 100%; border-radius: 8px; font-weight: bold; font-size: 16px; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);}
        .premium-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4); }
        .premium-btn:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none;}
        
        .action-btns { display: flex; gap: 10px; position: absolute; top: 20px; right: 20px; }
        .mini-btn { background: #334155; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: 0.3s; }
        .mini-btn:hover { background: #475569; }
        .mini-btn.download { background: #10b981; }
        .mini-btn.download:hover { background: #059669; }

        @media (max-width: 768px) { .extractor-container { grid-template-columns: 1fr; } .action-btns { position: static; margin-bottom: 15px; justify-content: flex-end; } }
    </style>
</head>
<body>

    <header>
        <div class="container" style="padding: 20px 0; display:flex; justify-content:space-between; align-items:center;">
            <div class="logo" style="font-weight:bold; font-size:24px;">🚀 ToolVerse</div>
            <a href="index.html" style="text-decoration:none; color:#333; font-weight:500;">Back to Home</a>
        </div>
    </header>

    <section class="tool-header" style="text-align: center; padding: 60px 20px; background: linear-gradient(to right, #e0e7ff, #ede9fe);">
        <h1 style="font-size: 2.5rem; color: #3730a3; margin-bottom: 10px;">📜 AI Transcript Extractor & Translator</h1>
        <p style="color: #4f46e5; font-size: 1.1rem;">Extract and automatically translate YouTube transcripts into any world language instantly.</p>
    </section>

    <div class="extractor-container">
        <!-- Left Side: Input -->
        <div class="input-card">
            <div class="form-group">
                <label>Paste YouTube Video Link</label>
                <input type="text" id="ytUrlInput" placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ">
            </div>

            <div class="form-group">
                <label>Target Language</label>
                <select id="langSelect">
                    <option value="en">English</option>
                    <option value="af">Afrikaans</option>
                    <option value="sq">Albanian</option>
                    <option value="am">Amharic</option>
                    <option value="ar">Arabic</option>
                    <option value="hy">Armenian</option>
                    <option value="az">Azerbaijani</option>
                    <option value="eu">Basque</option>
                    <option value="be">Belarusian</option>
                    <option value="bn">Bengali</option>
                    <option value="bs">Bosnian</option>
                    <option value="bg">Bulgarian</option>
                    <option value="ca">Catalan</option>
                    <option value="ceb">Cebuano</option>
                    <option value="ny">Chichewa</option>
                    <option value="zh-CN">Chinese (Simplified)</option>
                    <option value="zh-TW">Chinese (Traditional)</option>
                    <option value="co">Corsican</option>
                    <option value="hr">Croatian</option>
                    <option value="cs">Czech</option>
                    <option value="da">Danish</option>
                    <option value="nl">Dutch</option>
                    <option value="eo">Esperanto</option>
                    <option value="et">Estonian</option>
                    <option value="tl">Filipino</option>
                    <option value="fi">Finnish</option>
                    <option value="fr">French</option>
                    <option value="fy">Frisian</option>
                    <option value="gl">Galician</option>
                    <option value="ka">Georgian</option>
                    <option value="de">German</option>
                    <option value="el">Greek</option>
                    <option value="gu">Gujarati</option>
                    <option value="ht">Haitian Creole</option>
                    <option value="ha">Hausa</option>
                    <option value="haw">Hawaiian</option>
                    <option value="iw">Hebrew</option>
                    <option value="hi">Hindi</option>
                    <option value="hmn">Hmong</option>
                    <option value="hu">Hungarian</option>
                    <option value="is">Icelandic</option>
                    <option value="ig">Igbo</option>
                    <option value="id">Indonesian</option>
                    <option value="ga">Irish</option>
                    <option value="it">Italian</option>
                    <option value="ja">Japanese</option>
                    <option value="jw">Javanese</option>
                    <option value="kn">Kannada</option>
                    <option value="kk">Kazakh</option>
                    <option value="km">Khmer</option>
                    <option value="rw">Kinyarwanda</option>
                    <option value="ko">Korean</option>
                    <option value="ku">Kurdish (Kurmanji)</option>
                    <option value="ky">Kyrgyz</option>
                    <option value="lo">Lao</option>
                    <option value="la">Latin</option>
                    <option value="lv">Latvian</option>
                    <option value="lt">Lithuanian</option>
                    <option value="lb">Luxembourgish</option>
                    <option value="mk">Macedonian</option>
                    <option value="mg">Malagasy</option>
                    <option value="ms">Malay</option>
                    <option value="ml">Malayalam</option>
                    <option value="mt">Maltese</option>
                    <option value="mi">Maori</option>
                    <option value="mr">Marathi</option>
                    <option value="mn">Mongolian</option>
                    <option value="my">Myanmar (Burmese)</option>
                    <option value="ne">Nepali</option>
                    <option value="no">Norwegian</option>
                    <option value="or">Odia (Oriya)</option>
                    <option value="ps">Pashto</option>
                    <option value="fa">Persian</option>
                    <option value="pl">Polish</option>
                    <option value="pt">Portuguese</option>
                    <option value="pa">Punjabi</option>
                    <option value="ro">Romanian</option>
                    <option value="ru">Russian</option>
                    <option value="sm">Samoan</option>
                    <option value="gd">Scots Gaelic</option>
                    <option value="sr">Serbian</option>
                    <option value="st">Sesotho</option>
                    <option value="sn">Shona</option>
                    <option value="sd">Sindhi</option>
                    <option value="si">Sinhala</option>
                    <option value="sk">Slovak</option>
                    <option value="sl">Slovenian</option>
                    <option value="so">Somali</option>
                    <option value="es">Spanish</option>
                    <option value="su">Sundanese</option>
                    <option value="sw">Swahili</option>
                    <option value="sv">Swedish</option>
                    <option value="tg">Tajik</option>
                    <option value="ta">Tamil</option>
                    <option value="tt">Tatar</option>
                    <option value="te">Telugu</option>
                    <option value="th">Thai</option>
                    <option value="tr">Turkish</option>
                    <option value="tk">Turkmen</option>
                    <option value="uk">Ukrainian</option>
                    <option value="ur">Urdu</option>
                    <option value="ug">Uyghur</option>
                    <option value="uz">Uzbek</option>
                    <option value="vi">Vietnamese</option>
                    <option value="cy">Welsh</option>
                    <option value="xh">Xhosa</option>
                    <option value="yi">Yiddish</option>
                    <option value="yo">Yoruba</option>
                    <option value="zu">Zulu</option>
                </select>
            </div>

            <button class="premium-btn" id="extractBtn">⚡ Extract & Translate</button>
        </div>

        <!-- Right Side: Output Studio -->
        <div class="output-card">
            <div class="action-btns">
                <button class="mini-btn" id="copyBtn">📋 Copy</button>
                <button class="mini-btn download" id="downloadTxtBtn">📥 Download TXT</button>
            </div>
            
            <h3>📝 Extracted Content</h3>
            <div class="transcript-content" id="transcriptOutput">
                <span style="color: #94a3b8; font-style: italic;">Paste a YouTube link on the left, choose your language, and click extract. The translated text will appear here...</span>
            </div>
        </div>
    </div>

    <!-- App Logic -->
    <script src="transcript-extractor.js"></script>

    <!-- VVIP UNIVERSAL UNLOCK SCRIPT -->
    <script>
        const isVVIPAuth = localStorage.getItem('ToolVerse_Auth') === 'true' || localStorage.getItem('isLoggedIn') === 'true';
        if (isVVIPAuth) {
            const unlockStyle = document.createElement('style');
            unlockStyle.innerHTML = `
                #authOverlay, #firebaseAuthModal, .auth-modal, #loginModal { 
                    display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; visibility: hidden !important;
                }
                body { overflow: auto !important; }
            `;
            document.head.appendChild(unlockStyle);
            window.isUserLoggedIn = true;
            setInterval(() => {
                const lockScreens = document.querySelectorAll('#authOverlay, #firebaseAuthModal, .auth-modal, #loginModal');
                lockScreens.forEach(lock => { if(lock) lock.style.display = 'none'; });
                window.isUserLoggedIn = true;
            }, 200);
        }
    </script>
</body>
</html>
