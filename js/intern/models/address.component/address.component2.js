/**
 * To limit the amount of Api calls, every search is stored in local storage
 */
export class AddressWidget extends HTMLElement {
    tmpl;
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
            });
    }

    async handlePostCodeChange(event) {
        let search = event.target.value;
        if (search.length < 2)
            alert("Sucheingabe nicht ausreichend:\nBitte geben Sie eine Postleitzahl (mind. 4 Ziffern) ein.");
        else if (search.length >= 5) {
            search = search.substring(0, 5);
            search = await this.getCityDistricts(search);
            if (search) {
                if (search["city"])
                    this.renderCityDistricts(search["rows"]);
                else{
                    this.cityField.value = search["rows"][0]["city"];
                    this.renderStreetsList(search["rows"]);
                }
                   
            }
            else
                alert("Search Error. Please Try Again.");
        }
        else {
            search = await this.getPLZs(search);
            if (search)
                this.renderPLZList(search["rows"]);
            else
                alert("Search Error. Please Try Again.");
        }
    }

    
    async getPLZs(plzchunck) {
        const stored = this.storage.find(search => search["finda"] == "adv" && search["searchString"] == plzchunck);
        if (!stored) {
            let result = await this.saveAdvSearch(plzchunck);
            return result;
        } else {
            return stored;
        }
    }

    async getCityDistricts(fullPLZ) {
        const stored = this.storage.find(search => (search["finda"] == "adv" && (search["searchString"] == fullPLZ + " " + search["city"] || search["searchString"] == fullPLZ)));
        if (!stored) {
            let result = await this.saveAdvSearch(fullPLZ);
            return result;
        } else {
            return stored;
        }
    }

    renderStreetsList(results){
        this.streetField.setAttribute("list", "");
        const streetList = this.shadowRoot.getElementById("streets");
        streetList.innerHTML = "";
        results.forEach(result => streetList.innerHTML += this.generateStreetOption(result));
        this.streetField.setAttribute("list", "streets");
        this.streetField.focus();
    }

    generateStreetOption(option){
        return `<option value="${option["street"]}">${option["street"]} ${option["city"]} (${option["plz"]})</option>`;
    }

    renderCityDistricts(results) {
        this.cityField.setAttribute("list", "");
        const citiesList = this.shadowRoot.getElementById("cities");
        citiesList.innerHTML = "";
        results.forEach(result => citiesList.innerHTML += this.generateDistrictOption(result));
        this.cityField.setAttribute("list", "cities");
        this.cityField.focus();
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

    /**
     * 
     * @param {string | number} plzchunck 
     */
    async setPLZList(plzchunck) {
        const stored = this.storage.find(search => search["finda"] == "adv" && search["searchString"] == plzchunck);
        if (stored) {
            this.renderPLZList(stored["row"]);
        }
        else {
            let save = await this.saveSearchByPLZ(plzchunck);
            if (save)
                this.setPLZList(plzchunck);

        }
    }

    renderPLZList(results) {
        this.plzField.setAttribute("list", "");
        const plzList = this.shadowRoot.getElementById("post-codes");
        plzList.innerHTML = "";
        results.forEach(result => plzList.innerHTML += this.generatePLZOption(result));
        this.plzField.setAttribute("list", "post-codes");
    }

    generatePLZOption(option) {
        return `<option value="${option["plz"]}">${option["city"]} (${option["cityaddition"]})</option>`;
    }

    async saveAdvSearch(plz) {
        const response = await fetch(`https://cors-anywhere.herokuapp.com/https://www.postdirekt.de/plzserver/PlzAjaxServlet?adv_plz=${plz}&adv_city=&finda=adv&adv_city_clear=&adv_district=&adv_street=&lang=de_DE`);
        let result;
        if (response.status == 200) {
            result = await response.json();
            this.storage.push(result);
            localStorage.setItem("searches", JSON.stringify(this.storage));
        }
        return result;
    }

    handleCityChange(event) {
        const search = event.target.value;
        if (search.length < 2)
            alert("Sucheingabe nicht ausreichend:\nBitte geben Sie einen Ort (mind. 2 Zeichen) ein.");
        else {
            // this.setCitiesListByName(search);
        }
    }

    handleCityInput(event) {
       console.log(event);
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