/**
 * To limit the amount of Api calls, every search is stored in local storage
 */
export class AddressWidget extends HTMLElement {
    tmpl;
    form;
    storage;
    searchCity;
    searchStreets;
    searchPlz;
    plzField;
    cityField;
    streetField;

    // Can define constructor arguments if you wish.
    constructor() {
        super();
        this.storage = JSON.parse(localStorage.getItem("searches")) || [];
        this.tmpl = document.createElement('template');
    }

    /**
     * 
     * Called every time the element is inserted into the DOM. Useful for running setup code, such as fetching resources or rendering. Generally, you should try to delay work until this time.
    */
    connectedCallback() {
        fetch('/js/intern/models/address.component/address.component.html')
            .then(r => r.text())
            .then(t => {
                /**
                 * Attach Widget Template to shadowRoot
                 */
                this.tmpl.innerHTML = t;
                const shadowRoot = this.attachShadow({ mode: 'open' });
                shadowRoot.appendChild(this.tmpl.content.cloneNode(true));

                /**
                 * Initialize Form
                 */
                this.plzField = this.shadowRoot.getElementById("post-code-field");
                this.cityField = this.shadowRoot.getElementById("city-field");
                this.streetField = this.shadowRoot.getElementById("street-field");

                this.plzField.addEventListener('change', this.handlePostCodeChange.bind(this));
                this.cityField.addEventListener('change', this.handleCityChange.bind(this));
                this.cityField.addEventListener('keypress', this.handleCityKeyPress.bind(this));

                // this.form = this.shadowRoot.getElementById("address-form");
                // this.form.elements["post-code"].addEventListener('change', this.handlePostCodeChange.bind(this));
                // // this.form.elements["post-code"].addEventListener('keypress', this.handlePostCodeKeyPress.bind(this));

                // this.form.elements["city"].addEventListener('input', this.handleCity.bind(this));
                // this.form.elements["city"].addEventListener('keypress', this.handleCity.bind(this));
                // this.form.elements["city"].addEventListener('change', this.handleCity.bind(this));
                // this.form.addEventListener('submit', this.handleSubmit.bind(this));
            });
        /**
         * Note: In the above snippet we use a template element to clone DOM, instead of setting the innerHTML of the shadowRoot.
         *  This technique cuts down on HTML parse costs because the content of the template is only parsed once, whereas calling innerHTML on the shadowRoot will parse the HTML for each instance.
         */
    }

    handleCity(){

    }

    handleCityChange(event) {
        console.log(event.type);
        if (event.type == "change") {
            const search = event.target.value;
            if (search.length < 2)
                alert("Sucheingabe nicht ausreichend:\nBitte geben Sie einen Ort (mind. 2 Zeichen) ein.");
            else {
               this.setCitiesListByName(search);
            }
            return;
        }
        
    }

    handleCityKeyPress(event) {
        // console.log(event.type);
        // if (event.type == "change") {
        //     const search = event.target.value;
        //     if (search.length < 2)
        //         alert("Sucheingabe nicht ausreichend:\nBitte geben Sie einen Ort (mind. 2 Zeichen) ein.");
        //     else {
        //         // this.setPostCodesList(search);
        //         this.set
        //     }
        //     return;
        // }
        console.log("CITY KEY PRESS");
    }

    autoComplete(result) {
        console.log(result);
    }

    setPLZList(plz) {
        const stored = this.storage.find(search => search["finda"] == "city" && search["searchString"] == plz && !search["city"]);
        if (stored) {
            this.renderPLZList(stored);
        }
        else {
            this.saveFindCity(plz)
                .then(() => this.setPLZList(plz));
        }
    }

    renderPLZList(result) {
        const plzList = this.shadowRoot.getElementById("post-codes");
        plzList.innerHTML = "";
        result["rows"].forEach(row => plzList.innerHTML += this.generatePLZOption(row));
        //this.plzField.insertAdjacentElement("afterend", plzList);
        this.plzField.setAttribute("list", "post-codes");
    }

    generatePLZOption(option) {
        return `<option value="${option["plz"]}">${option["city"]} (${option["cityaddition"]})</option>`;
    }

    handlePostCodeChange(event) {
        event.preventDefault();
        let search = event.target.value;
        if (search.length < 2)
            alert("Sucheingabe nicht ausreichend:\nBitte geben Sie eine Postleitzahl (mind. 4 Ziffern) ein.");
        else if (search.length >= 5) {
            search = search.substring(0, 5);
            this.autoComplete(search);
            // this.setCitiesListByPLZ(search);
        }
        else {
            this.setPLZList(search);
        }
    }


    setCitiesListByName(search) {
        const stored = this.storage.find(search => search["searchString"] == "" && search["finda"] == "");
        if (stored) {
            if (!stored["city"]) {
                this.renderCitiesList(stored);
                // this.form.elements["city"].focus();
                // this.form.elements["city"].click();
            }
            else {
                //this.renderDistrictsList(stored);
                // this.form.elements["city"].value = stored["city"];
                //CLEAR DATALIST
                // this.form.elements["city"].dispatchEvent(new Event('change'));
                //TODO SET STREETS LIST BY CITY AND PLZ
            }
        }
        else {
            this.saveCitiesbyName(search)
                .then(() => this.setCitiesListByName(search));
        }
    }

    setCitiesListByPLZ(plz) {
        const stored = this.storage.find(search => search["searchString"] == plz || (search["city"] && search["searchString"] == plz + " " + search["city"]));
        if (stored) {
            if (!stored["city"]) {
                this.renderCitiesList(stored);
                this.form.elements["city"].focus();
                this.form.elements["city"].click();
            }
            else {
                //this.renderDistrictsList(stored);
                this.form.elements["city"].value = stored["city"];
                //CLEAR DATALIST
                // this.form.elements["city"].dispatchEvent(new Event('change'));
                //TODO SET STREETS LIST BY CITY AND PLZ
            }
        }
        else {
            this.saveCitybyPLZ(plz)
                .then(() => this.setCitiesListByPLZ(plz));
        }
    }

    renderCitiesList(result) {
        const citiesList = this.shadowRoot.getElementById("cities");
        citiesList.innerHTML = "";
        result["rows"].forEach(row => citiesList.innerHTML += this.generateCityOption(row));
        this.cityField.setAttribute("list", "cities");
    }

    renderDistrictsList(result) {
        const citiesList = this.shadowRoot.getElementById("cities");
        citiesList.innerHTML = "";
        result["rows"].forEach(row => citiesList.innerHTML += this.generateDistrictOption(row));
    }

    generateCityOption(option) {
        return `<option value="${option["city"]}">${option["plz"]} ${option["city"]} (${option["cityaddition"]})</option>`;
    }

    generateDistrictOption(option) {
        return `<option value="${option["district"]}">${option["city"]} (${option["district"]})</option>`;
    }

    handleSubmit(event) {
        event.preventDefault();
        console.log(event.target);
    }

    setCityByPLZ(plz) {
        const stored = this.storage.find(search => search['finda'] == 'city' && search['searchString'].includes(plz));
        if (stored) {
            this.form.elements["city"].value = stored["city"];
            this.form.elements["city"].dispatchEvent(new Event('input'));

        }
        else {
            this.saveCitybyPLZ(plz)
                .then(() => this.setCityByPLZ(plz))
                .catch(error => alert(error));
        }
    }

    setStreets(city) {

    }

    setDistrictStreets() {

    }

    async saveFindCity(plz) {
        const response = await fetch(`https://cors-anywhere.herokuapp.com/https://www.postdirekt.de/plzserver/PlzAjaxServlet?finda=city&city=${plz}&lang=de_DE`);
        if (response.status == 200) {
            const result = await response.json();
            this.storage.push(result);
            localStorage.setItem("searches", JSON.stringify(this.storage));
        }
        else {
            // return new Error(`ERROR::${response.status}: ${response.statusText}` );
        }
    }

    async saveCitybyPLZ(plz) {
        const response = await fetch(`https://cors-anywhere.herokuapp.com/https://www.postdirekt.de/plzserver/PlzAjaxServlet?finda=city&city=${plz}&lang=de_DE`);
        if (response.status == 200) {
            const result = await response.json();
            this.storage.push(result);
            localStorage.setItem("searches", JSON.stringify(this.storage));
        }
        else {
            // return new Error(`ERROR::${response.status}: ${response.statusText}` );
        }
    }

    async saveCitiesbyName(name) {
        const response = await fetch(`https://cors-anywhere.herokuapp.com/https://www.postdirekt.de/plzserver/PlzAjaxServlet?autocomplete=plz&plz_city=${name}`);
        if (response.status == 200) {
            const result = await response.json();
            this.storage.push(result);
            localStorage.setItem("searches", JSON.stringify(this.storage));
        }
        else {
            // return new Error(`ERROR::${response.status}: ${response.statusText}` );
        }
    }

    /**
     * Called every time the element is removed from the DOM. Useful for running clean up code.
     */
    disconnectedCallback() {
        console.log("disconnectedCallback");
    }

    /**
     * Called when an observed attribute has been added, removed, updated, or replaced. Also called for initial values when an element is created by the parser, or upgraded. Note: only attributes listed in the observedAttributes property will receive this callback.
     * @param {*} attrName 
     * @param {*} oldVal 
     * @param {*} newVal 
     */
    // Only called for the disabled and open attributes due to observedAttributes
    attributeChangedCallback(name, oldValue, newValue) {
        console.log("attributechangecallback");
        // When the drawer is disabled, update keyboard/screen reader behavior.
        if (this.disabled) {
            this.setAttribute('tabindex', '-1');
            this.setAttribute('aria-disabled', 'true');
        } else {
            this.setAttribute('tabindex', '0');
            this.setAttribute('aria-disabled', 'false');
        }
        // TODO: also react to the open attribute changing.
    }

    /**
     * The custom element has been moved into a new document (e.g. someone called document.adoptNode(el)).
     */
    adoptedCallback() {
        console.log("adopted");
    }
}



/* <share-buttons>
  <social-button type="twitter"><a href="...">Twitter</a></social-button>
  <social-button type="fb"><a href="...">Facebook</a></social-button>
  <social-button type="plus"><a href="...">G+</a></social-button>
</share-buttons>



// Fetch all the children of <share-buttons> that are not defined yet.
let undefinedButtons = buttons.querySelectorAll(':not(:defined)');

let promises = [...undefinedButtons].map(socialButton => {
  return customElements.whenDefined(socialButton.localName);
});

// Wait for all the social-buttons to be upgraded.
Promise.all(promises).then(() => {
  // All social-button children are ready.
}); */