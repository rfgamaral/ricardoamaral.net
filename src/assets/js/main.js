(function () {
    window.onload = function () {
        document.body.className = '';
    }

    window.ontouchmove = function () {
        return false;
    }

    window.onorientationchange = function () {
        document.body.scrollTop = 0;
    }
}());
