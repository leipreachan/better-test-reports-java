/// TODO: to check if still valid and fix incorrect nesting ??
// Element >>http://web:web@gridrouter.d3:44441/wd/hub/session/b0721b41341782bfcff2507e2e5894a6d1e09d9e-ac15-41ea-905e-d9bba244fd20/element/44<< is not clickable at point (631.5, 584.0333251953125). Other element would receive the click: <div id="disable_ovl"></div>
// TODO: opening a preview should not call mutator
// TODO: get rid of double filtering (firstly filter TRANSFORM_RULES by address, if get default filters)
// TODO: there should be only one default TRANSFORM_RULE as all the others will be ignored
// TODO: add options for preloading (maybe?)

const
    STACKTRACE_CLASS = 'fullStacktrace';

const
    PREVIEW_CLASS = 'better-preview',
    INTELLIJ_LINK_CLASS = 'better-intellij-link',
    BOLT = 'bolt',
    MEDIA_PNG = 'png',
    MEDIA_MP4 = 'mp4';

const IDE_PORTS = {
    rubymine: 63342,
    phpstorm: 63342
};

const
    INTELLIJ_HOST = 'localhost',
    INTELLIJ_API = 'api/file/';

let
    overview_map = {},
    buildlog_map = {},
    teamcity_address = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;

const
    SPARKLINE_POINTS = 200;

const DEFAULT_MAX_HEIGHT = '80vh';

let
    TEST_SUCCESS_RATE = true,
    CURRENT_BUILDTYPE_AS_DEFAULT = false;

// to enable debug messages use this snippet:
// v=document.createElement('div'); v.id='betterDebug'; document.body.appendChild(v);
const debug = (message, obj = null) => {
    if (document.querySelectorAll('#betterDebug').length === 0)
        return;
    if (obj !== null) {
        console.log(`better.js: ${message}`, obj);
    } else {
        console.log(`better.js: ${message}`);
    }
};

const attrs = (node, attributes) => {
    for (let index in attributes) {
        node.setAttribute(index, attributes[index]);
    }
    return node;
};

async function makeRequest(method, url) {
    debug(`fetch ${url}`);

    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    });
}

function draw_sparkline() {
    const tcEntryPoint = `${teamcity_address}/app/rest/testOccurrences`;
    const currentBuildId = (/buildId=(\d+)/.exec(window.location.search))[1];

    function getTestLink(buildId, testId)
    {
        return `${teamcity_address}/viewLog.html?buildId=${buildId}#testNameId${testId}`
    }

    function showPopup(event)
    {
        debug('hover event', event);
        let popup, eventx = event.pageX;
        if (typeof document.sparklinePopup === 'undefined') {
            pin = document.body.appendChild(attrs(document.createElement('div'),{id: 'popupPin'}));
            popup = document.body.appendChild(attrs(document.createElement('div'),{id: 'betterPopup'}));
            document.sparkPin = pin;
            document.sparklinePopup = popup;
            pin.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" height="100%" width="100%"><ellipse cy="5" rx="2" ry="2" cx="10"/><ellipse cy="17" rx="3" ry="3" cx="10"/><line x1="10" y1="20" x2="10" y2="5"></line></svg>';
        } else {
            pin = document.sparkPin;
            popup = document.sparklinePopup;
            popup.innerHTML = '';
        }

        if (this.classList.contains('red-bar')) {
            popup.innerHTML = '<span class="svg-icon js_buildStatusIcon buildStatusIcon buildStatusIcon_error buildStatusIcon_size_S" style="display: inline-block; width: 12px; height: 12px"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="100%" width="100%"><path d="M8 0a8 8 0 1 0 8 8 8 8 0 0 0-8-8zm0 13.94a1.42 1.42 0 1 1 1.42-1.41A1.42 1.42 0 0 1 8 13.94zM9.67 3.6l-.43 5.5a1.18 1.18 0 0 1-1.3 1 1.17 1.17 0 0 1-1.14-1l-.43-5.5A1.54 1.54 0 0 1 7.91 2a1.6 1.6 0 0 1 1.76 1.4z"></path></svg></span>';
        }
        const timelink = attrs(document.createElement('a'), {href: getTestLink(this.buildId, this.parentNode.parentNode.dataset.testId), target:'_blank', title: 'Open this build in another tab'});
        timelink.appendChild(document.createTextNode(`${this.titletime} »`));
        popup.appendChild(timelink);
        this.title.split(`\n`).forEach((item)=> {
            const title=document.createElement('div');
            title.appendChild(document.createTextNode(item));
            popup.appendChild(title);
        });
//        popup.innerHTML += '<svg><path fill-rule="evenodd" d="M6.997 0A6.995 6.995 0 0 0 0 7c0 3.867 3.129 7 6.997 7a7.001 7.001 0 1 0 0-14zM7 12.6A5.598 5.598 0 0 1 1.4 7c0-3.094 2.506-5.6 5.6-5.6s5.6 2.506 5.6 5.6-2.506 5.6-5.6 5.6zm.35-9.1H6.3v4.2l3.672 2.205.528-.861-3.15-1.869V3.5z"></path></svg>' + this.duration;

        let boundingClientRect = event.target.getBoundingClientRect();
        const top = boundingClientRect.top + boundingClientRect.height + window.scrollY + 13,
            left = (eventx - popup.offsetWidth / 2);
        popup.style.top = top + 'px';
        popup.style.left = (left > 5 ? left : 5) + 'px';
        const
            pinTop = boundingClientRect.top + boundingClientRect.height + window.scrollY;
            pinLeft = boundingClientRect.left + boundingClientRect.width/2 - pin.getBoundingClientRect().width/2 + window.scrollX;
        pin.style.top = `${pinTop}px`;
        pin.style.left = `${pinLeft}px`;

        popup.onmouseover = () => {
            window.clearTimeout(document.sparklinePopupTimeout);
        };
        popup.onmouseout = hidePopup;

        document.sparklinePopupTimeout = window.setTimeout(() => {
            if (document.sparklinePopupTimeout) window.clearTimeout(document.sparklinePopupTimeout);
            document.sparklinePopup.style.visibility = 'visible';
            document.sparkPin.style.visibility = 'visible';
        }, 200);
    }

    function hidePopup()
    {
        window.clearTimeout(document.sparklinePopupTimeout);
        document.sparklinePopupTimeout = window.setTimeout(() => {
            document.sparklinePopup.style.visibility = 'hidden';
            document.sparkPin.style.visibility = 'hidden';
        }, 200);
    }

    async function retrieveTestResults(fetchUrl) {
        let result = '';
        try {
            const response = await makeRequest('GET', fetchUrl);
            result = response.responseXML;
        } catch (e) {
        }
        return result;
    }

    function addRectangles(xmlTestResult, currentBuildId, svgNode, title = '') {
        const step = 5, width = 5, testResults = Array.from(xmlTestResult.getElementsByTagName('testOccurrence'));
        let x = 0, success = 0, titleBuildType;
        for (let item of testResults) {
            const value = item.hasAttribute('status') ? item.attributes.status.nodeValue : '',
                duration = item.hasAttribute('duration') ? item.attributes.duration.nodeValue : false,
                buildInfo = item.getElementsByTagName('build')[0],
                buildTypeName = item.getElementsByTagName('buildType')[0].attributes.name.nodeValue,
                rect = attrs(document.createElementNS('http://www.w3.org/2000/svg', 'rect'), {x, width});
            switch (value) {
                case 'SUCCESS':
                    attrs(rect, {y: 5, height: 3, class: "green-bar"});
                    success++;
                    break;
                case 'FAILURE':
                    attrs(rect, {y: 3, height: 7, class: "red-bar"});
                    break;
                default:
                    continue;
            }
            if (buildInfo.id === currentBuildId) {
                titleBuildType = buildTypeName;
                attrs(rect, {y: 0, height: 13});
                rect.classList.add('current');
            }
            rect.buildId = buildInfo.id;
            const buildDate = item.getElementsByTagName('startDate')[0].textContent,
                buildBranchName = buildInfo.hasAttribute('branchName') ? buildInfo.attributes.branchName.nodeValue : '<empty>',
                t = /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(buildDate);
            let duration_string = '';
            if (duration) {
                const mins_dec = duration/60000,
                    mins = Math.trunc(mins_dec),
                    sec_dec = (mins_dec - mins) * 60,
                    sec = Math.trunc(sec_dec),
                    ms =  Math.round((sec_dec - sec)*1000),
                    sec_padded = (sec+'').padStart(2, '0');
                duration_string = `\n duration: ${mins}m:${sec_padded}s,${ms}ms`;
            }
            rect.titletime = `${t[1]}-${t[2]}-${t[3]} ${t[4]}:${t[5]}:${t[6]}`;
            rect.title = `${buildTypeName}\nbranch: ${buildBranchName} ${duration_string}`;
            rect.onmouseover = showPopup;
            rect.onmouseout = hidePopup;
            svgNode.appendChild(rect);
            x += step;
        }
        let rate = (success * 100 / testResults.length).toString().substr(0, 5);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        title = title || 'Success rate';
        text.innerHTML = `${title}: ${rate}%`;
        svgNode.appendChild(attrs(text, {x: x + step * 2, y: 11}));
    }

    async function drawSVGFromUrl(wrapper, fetchUrl, title) {
        const svg = attrs(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), {'data-type': 'sparkline'});
        wrapper.appendChild(svg);
        let result = await retrieveTestResults(fetchUrl);
        addRectangles(result, currentBuildId, svg, title);
        return true;
    }

    function reDrawSpark(event) {
        debug('event', event);
        if ((event.metaKey === true || event.altKey === true) && event.target.tagName === 'rect') {
            window.open(getTestLink(event.target.buildId, this.dataset.testId));
            return;
        }

        const testId = this.dataset.testId,
            buildType = this.dataset.buildType;

        if (!this.globalStat && buildType.length === 0) {
            return;
        }

        const
            testResultsUrl = `${tcEntryPoint}?fields=testOccurrence(status,duration,build(id,branchName,buildType(name),startDate))&locator=test:(id:${testId}),ignored:false,count:${SPARKLINE_POINTS}`;

        if (this.firstChild) this.removeChild(this.firstChild);

        if (this.globalStat) {
            drawSVGFromUrl(this, testResultsUrl, 'Success rate (across all runs)');
        } else {
            drawSVGFromUrl(this, `${testResultsUrl},buildType:${buildType}`, 'Success rate (this configuration)');
        }

        this.globalStat = !this.globalStat;
    }

    const stacktraces = document.querySelectorAll(`.${STACKTRACE_CLASS}:not([data-sparkline])`);
    let currentBuildType = '',
        url = (/buildTypeId=(\w+)/.exec(window.location.search));
    if (url) {
        currentBuildType = url[1];
    }

    if (stacktraces.length === 0) {
        return;
    }

    debug('sparkline');
    for (let item of stacktraces) {
        let matches = /fullStacktrace_\d+_([\d-]+)/.exec(item.id);
        let testId = matches[1];
        item.dataset.sparkline = testId;

        const parentNode = item.parentNode;
        const wrapper = parentNode.insertBefore(document.createElement('div'), parentNode.firstChild);
        wrapper.classList.add('sparkline-wrapper');
        wrapper.globalStat = currentBuildType ? !CURRENT_BUILDTYPE_AS_DEFAULT : true;
        wrapper.dataset.testId = testId;
        wrapper.dataset.buildType = currentBuildType;

        wrapper.onclick = reDrawSpark;
        wrapper.click();
    }
}

function get_media_type(element) {
    return element.previewtype || '';
}

let is_known_type = function (type) {
    return type === MEDIA_PNG || type === MEDIA_MP4;
};

function create_media_preview(event) {
    const target = event.target;
    const type = get_media_type(target);
    const create_preview_container = (opener) => {
        let id = (new Date()).toJSON();
        return attrs(document.createElement('div'), {class: 'preview', id});
    };

    const toggle_image_zoom = (event) => {
        let image = event.target;
        if (image.zoomed === true) {
            image.style.maxHeight = DEFAULT_MAX_HEIGHT;
            image.style.cursor = 'zoom-in';
            image.title = 'Zoom in';
        } else {
            image.style.removeProperty('max-height');
            image.style.cursor = 'zoom-out';
            image.title = 'Zoom out';
        }
        image.zoomed = !image.zoomed;
    };

    const create_media = (type, src) => {
        let media = null;
        switch (type) {
            case MEDIA_PNG:
                media = document.createElement('img');
                media.src = src;
                media.style.maxHeight = DEFAULT_MAX_HEIGHT;
                media.addEventListener('load', () => {
                    if (window.innerHeight < media.height + 200) {
                        media.title = 'Zoom in';
                        media.zoomed = false;
                        media.addEventListener('click', toggle_image_zoom);
                    }
                });
                break;
            case MEDIA_MP4:
                media = attrs(document.createElement('video'),
                    {controls: true, preload: 'metadata', playsinline: true, height: '438px', src});
                break;
        }
        return media;
    };

    if (is_known_type(type) && typeof target.previewId === 'undefined') {
        debug('create preview');
        const preview_container = create_preview_container(target);
        const media = create_media(type, target.href);

        preview_container.appendChild(media);
        target.parentNode.insertBefore(preview_container, target.nextSibling);
        target.previewId = preview_container.id;
        target.previewOpened = false;
    }
}

function toggle_media_preview(event) {
    debug('toggle preview');
    const target = event.target;
    const type = get_media_type(target);
    const preview_container = document.getElementById(target.previewId);

    if (is_known_type(type) && typeof target.previewId !== 'undefined') {
        event.preventDefault();
        if (target.previewOpened) {
            preview_container.style.display = 'none';
            target.title = '';
        } else {
            preview_container.style.display = 'block';
            target.title = 'Click to hide the preview';
        }
        target.previewOpened = !target.previewOpened;
    }
}

function select_code(event) {
    const target = event.target;
    const range = document.createRange();
    range.selectNodeContents(target);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    if (document.execCommand('copy')) {
        const copybox = document.createElement('div');
        copybox.innerText = 'Copied!';
        attrs(copybox, {id: 'copybox'});
        document.body.appendChild(copybox);
        let boundingClientRect = target.getBoundingClientRect();
        copybox.style.top = boundingClientRect.top + boundingClientRect.height + window.scrollY + 2 + 'px';
        copybox.style.left = (event.pageX - copybox.offsetWidth / 2) + 'px';
        setTimeout(() => {
            copybox.parentNode.removeChild(copybox);
        }, 1000);
    }
}

function open_in_intellij(event) {
    const port = IDE_PORTS[event.target.dataset.ide];
    const link = `http://${INTELLIJ_HOST}:${port}/${INTELLIJ_API}${event.target.dataset.path}`;

    debug(`link ${link}`);

    const req = new XMLHttpRequest();
    req.open("GET", link);
    req.send();
    event.preventDefault();
}

function loader(parent = null) {
    let loader;
    if (window.betterJSLoader) {
        debug('loader exists');
        loader = window.betterJSLoader;
    } else {
        debug('to create loader');
        loader = document.createElement('div');
        // standard teamcity loader
        loader.classList.add('ring-loader-inline');
        if (parent === null) {
            loader.id = 'betterjs-loader-fixed';
            parent = document.body;
        }
        // let animation = document.createElement('div');
        // animation.classList.add('cssload-loader');
        // loader.appendChild(animation);
        parent.appendChild(loader);
        window.betterJSLoader = loader;
    }
}

function hide_loader() {
    if (window.betterJSLoader) {
        let loader = window.betterJSLoader;
        loader.parentNode.removeChild(loader);
        window.betterJSLoader = false;
    }
}

function transform_mutated_nodes() {
    const previews = document.querySelectorAll(`.${STACKTRACE_CLASS} a:not(.${PREVIEW_CLASS})`);
    // console.debug('better.js', `${previews.length} elements to be transformed`);
    Array.from(previews).forEach((item) => {
        if (typeof item.previewtype === 'undefined') {
            const href = item.getAttribute('href');
            const matcher = href.match(/\.(\w{1,4})$/);
            item.previewtype = matcher && matcher[1] ? matcher[1] : '';
            // teamcity's bug
            if (item.previewtype === 'zip' && item.innerText.indexOf('!/') > 0) {
                item.href = item.innerText;
            } else if (item.previewtype.length > 0) {
                item.addEventListener('mouseover', create_media_preview, false);
                item.addEventListener('focus', create_media_preview, false);
                item.addEventListener('click', toggle_media_preview, false);
            }
        }
        item.classList.add(PREVIEW_CLASS);
    });


    Array.from(document.getElementsByTagName('code')).forEach((item) => {
        item.addEventListener('dblclick', select_code, false)
    });

    Array.from(document.getElementsByClassName(INTELLIJ_LINK_CLASS)).forEach((item) => {
        item.addEventListener('click', open_in_intellij, false)
    });

    draw_sparkline();
}

function main() {
    const allTests = document.getElementById('tst_group_build_fail');
    let observer = new MutationObserver((mutations) => {
                loader();
                mutations.forEach((mutation) => {
                    transform_mutated_nodes();
                });
                window.setTimeout(hide_loader, 500);
            });

    observer.observe(allTests, {attributes: true, childList: true, subtree: true, characterData: true});

    window.onunload = () => {
        observer.disconnect();
    };
}

(function () {
    if (typeof window !== "object" || window.hasBetterReports) {
        return;
    }
    window.hasBetterReports = true;
    window.addEventListener('load', (e) => {
        main();
    });
})();
