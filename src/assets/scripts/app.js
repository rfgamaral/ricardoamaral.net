(function (document, window) {
    // Private auxiliary functions

    function initCopyrightCurrentYear() {
        document.getElementById('current-year').innerHTML = new Date().getFullYear();
    }

    function initTwinklingStars() {
        const devicePixelRatio = Math.min(window.devicePixelRatio, 3) || 1;

        particlesJS('stars', {
            particles: {
                number: {
                    value: 300,
                    density: {
                        enable: true,
                        value_area: 600
                    }
                },
                color: {
                    value: '#ffffff'
                },
                shape: {
                    type: 'circle'
                },
                opacity: {
                    value: 1,
                    random: true,
                    anim: {
                        enable: true,
                        speed: 3,
                        opacity_min: 0
                    }
                },
                size: {
                    value: 1.5 / devicePixelRatio,
                    random: true,
                    anim: {
                        enable: true,
                        speed: 1,
                        size_min: 0.5 / devicePixelRatio,
                        sync: false
                    }
                },
                line_linked: {
                    enable: false
                },
                move: {
                    enable: true,
                    speed: 50,
                    direction: 'none',
                    random: true,
                    straight: true,
                    out_mode: 'bounce'
                }
            },
            retina_detect: true
        });
    }

    // Event handlers for various Window events

    window.onload = () => {
        document.body.removeAttribute('class');

        initCopyrightCurrentYear();
        initTwinklingStars();
    }

    window.onresize = () => {
        clearTimeout(window.onResizeEnd);
        window.onResizeEnd = setTimeout(initTwinklingStars, 250);
    }

    window.ontouchmove = () => false;

    window.onorientationchange = () => {
        document.body.scrollTop = 0;
    };
}(document, window));
