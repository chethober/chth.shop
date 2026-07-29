document.addEventListener('DOMContentLoaded', function() {
    const mainButton = document.getElementById('mainButton');
    const progressCircle = document.querySelector('.progress-ring-circle');
    const urlParams = new URLSearchParams(window.location.search);
    const fromValidPayment = urlParams.get('from_valid_payment') === 'true';

    let pressTimer;
    let isHolding = false;
    let progressInterval;

    // Function to show payment count
    function showPaymentCount() {
        if (fromValidPayment) {
            fetch('/api/stats')
                .then(response => response.json())
                .then(data => {
                    const container = document.querySelector('.container');
                    const existingCount = document.querySelector('.payment-count');
                    if (existingCount) {
                        existingCount.remove();
                    }
                    const paymentCount = document.createElement('div');
                    paymentCount.className = 'payment-count';
                    paymentCount.innerHTML = `
                        <div class="payment-info">
                            <h3>تعداد پرداخت‌های انجام شده: ${data.payments}</h3>
                            <p>شما از پرداخت موفق بازگشتید!</p>
                        </div>
                    `;
                    container.appendChild(paymentCount);
                });
        }
    }

    function dropBills() {
        const container = document.querySelector('body');
        for (let i = 0; i < 30; i++) {
            const bill = document.createElement('img');
            bill.src = '/static/1000.jpg';
            bill.className = 'falling-bill';
            bill.style.left = `${Math.random() * 100}vw`;
            bill.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(bill);
        }
    }

    // Show bills if coming from valid payment
    if (fromValidPayment) {
        dropBills();
    }

    function handlePress() {
        isHolding = true;
        mainButton.classList.add('holding');

        // Start progress animation
        startProgressAnimation();

        fetch('/api/click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        pressTimer = setTimeout(() => {
            if (isHolding) {
                window.location.href = '/pay';
            }
        }, 3000);
    }

    function startProgressAnimation() {
        const duration = 3000; // 3 seconds
        const steps = 60; // 60 steps for smooth animation
        const stepDuration = duration / steps;
        const circumference = 2 * Math.PI * 100; // 2πr where r=100
        const stepSize = circumference / steps;
        
        let currentStep = 0;
        
        progressInterval = setInterval(() => {
            currentStep++;
            const progress = (currentStep / steps) * 100;
            const dashOffset = circumference - (progress / 100) * circumference;
            
            progressCircle.style.strokeDashoffset = dashOffset;
            
            if (currentStep >= steps) {
                clearInterval(progressInterval);
            }
        }, stepDuration);
    }
    
    function resetProgress() {
        if (progressInterval) {
            clearInterval(progressInterval);
        }
        progressCircle.style.strokeDashoffset = '628.32'; // Reset to 0% progress
    }
    
    function handleRelease() {
        isHolding = false;
        mainButton.classList.remove('holding');
        clearTimeout(pressTimer);
        resetProgress();
    }



    // Event Listeners
    mainButton.addEventListener('mousedown', handlePress);
    mainButton.addEventListener('mouseup', handleRelease);
    mainButton.addEventListener('mouseleave', handleRelease);

    mainButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handlePress();
    });

    mainButton.addEventListener('touchend', (e) => {
        handleRelease();
    });

    // Initial setup
    showPaymentCount();
});