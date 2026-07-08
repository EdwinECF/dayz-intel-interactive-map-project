// js/uiManager.js

window.UIManager = function () {
    const mapContainer = document.querySelector(".map-container");
    const labelSizeSlider = document.getElementById("label-size-slider");
    const markerSizeSlider = document.getElementById("marker-size-slider");

    function initSliders() {
        labelSizeSlider?.addEventListener("input", event => {
            mapContainer?.style.setProperty("--label-scale", event.target.value);
        });

        markerSizeSlider?.addEventListener("input", event => {
            mapContainer?.style.setProperty("--marker-scale", event.target.value);
        });
    }

    function init() {
        initSliders();
    }

    return {
        init
    };
};