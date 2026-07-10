// js/managers/uiManager.js

window.UIManager = function () {
    const mapContainer = document.querySelector(".map-container");

    const labelSizeSlider =
        document.getElementById("label-size-slider");

    const markerSizeSlider =
        document.getElementById("marker-size-slider");

    const mapBrightnessSlider =
        document.getElementById("map-brightness-slider");

    const DISPLAY_SETTINGS_KEY = "dzAtlasDisplaySettings";

    const defaultSettings = {
        labelScale: "1",
        markerScale: "1",
        brightness: "0.72"
    };

    function loadSettings() {
        try {
            const savedSettings = JSON.parse(
                localStorage.getItem(DISPLAY_SETTINGS_KEY)
            );

            return {
                ...defaultSettings,
                ...savedSettings
            };
        } catch (error) {
            console.warn(
                "Could not load display settings. Using defaults.",
                error
            );

            return { ...defaultSettings };
        }
    }

    function saveSettings(settings) {
        localStorage.setItem(
            DISPLAY_SETTINGS_KEY,
            JSON.stringify(settings)
        );
    }

    function applySettings(settings) {
        if (!mapContainer) return;

        mapContainer.style.setProperty(
            "--label-scale",
            settings.labelScale
        );

        mapContainer.style.setProperty(
            "--marker-scale",
            settings.markerScale
        );

        mapContainer.style.setProperty(
            "--map-brightness",
            settings.brightness
        );

        if (labelSizeSlider) {
            labelSizeSlider.value = settings.labelScale;
        }

        if (markerSizeSlider) {
            markerSizeSlider.value = settings.markerScale;
        }

        if (mapBrightnessSlider) {
            mapBrightnessSlider.value = settings.brightness;
        }
    }

    function initLabelSize(settings) {
        labelSizeSlider?.addEventListener("input", event => {
            settings.labelScale = event.target.value;

            mapContainer?.style.setProperty(
                "--label-scale",
                settings.labelScale
            );

            saveSettings(settings);
        });
    }

    function initMarkerSize(settings) {
        markerSizeSlider?.addEventListener("input", event => {
            settings.markerScale = event.target.value;

            mapContainer?.style.setProperty(
                "--marker-scale",
                settings.markerScale
            );

            saveSettings(settings);
        });
    }

    function initMapBrightness(settings) {
        mapBrightnessSlider?.addEventListener("input", event => {
            settings.brightness = event.target.value;

            mapContainer?.style.setProperty(
                "--map-brightness",
                settings.brightness
            );

            saveSettings(settings);
        });
    }

    function init() {
        const settings = loadSettings();

        applySettings(settings);
        initLabelSize(settings);
        initMarkerSize(settings);
        initMapBrightness(settings);
    }

    return {
        init
    };
};