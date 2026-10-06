// ==========================================
// 1. PASSWORD VISIBILITY TOGGLE
// ==========================================
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('togglePassword');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// ==========================================
// 2. FORM SUBMISSION & AUTH HANDLER
// ==========================================
async function handleLogin(event) {
    event.preventDefault();

    const role = document.getElementById('userRole').value;
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const loginBtn = document.getElementById('loginBtn');
    const btnText = document.getElementById('btnText');
    const alertBox = document.getElementById('loginAlert');

    alertBox.style.display = 'none';
    loginBtn.disabled = true;
    btnText.innerText = 'AUTHENTICATING...';

    try {
        // Save session details to local storage
        localStorage.setItem('userRole', role);
        localStorage.setItem('userEmail', email);

        // Redirect to ticket dashboard
        window.location.href = 'index.html';

    } catch (err) {
        alertBox.innerText = 'Login failed. Please check your credentials.';
        alertBox.style.display = 'block';
    } finally {
        loginBtn.disabled = false;
        btnText.innerText = 'ACCESS PORTAL';
    }
}

// ==========================================
// 3. CLEAN & STEADY FALLING ICON ANIMATION
// ==========================================
const canvas = document.getElementById('iconRainCanvas');

if (canvas) {
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const icons = ['🎟️', '🎫', '✉️', '📩', '📧'];
    const fontSize = 20;
    const columnSpacing = 55;

    let columns = Math.floor(canvas.width / columnSpacing);
    let drops = Array.from({ length: columns }, () => ({
        y: Math.random() * -canvas.height,
        speed: 0.8 + Math.random() * 0.6,
        icon: icons[Math.floor(Math.random() * icons.length)]
    }));

    function drawCleanIcons() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${fontSize}px sans-serif`;

        columns = Math.floor(canvas.width / columnSpacing);
        while (drops.length < columns) {
            drops.push({
                y: Math.random() * -canvas.height,
                speed: 0.8 + Math.random() * 0.6,
                icon: icons[Math.floor(Math.random() * icons.length)]
            });
        }

        for (let i = 0; i < drops.length; i++) {
            const drop = drops[i];

            ctx.globalAlpha = 0.55;
            ctx.fillText(drop.icon, i * columnSpacing + 15, drop.y);

            drop.y += drop.speed;

            if (drop.y > canvas.height + 40) {
                drop.y = -30;
                drop.icon = icons[Math.floor(Math.random() * icons.length)];
                drop.speed = 0.8 + Math.random() * 0.6;
            }
        }

        ctx.globalAlpha = 1.0;
        requestAnimationFrame(drawCleanIcons);
    }

    requestAnimationFrame(drawCleanIcons);
}