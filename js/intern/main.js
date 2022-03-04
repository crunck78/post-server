// import {html, render} from '../../node_modules/lit-html/lit-html.js';
import {AddressWidget} from './models/address.component/address.component2.js';

window.customElements.define('address-widget', AddressWidget);
window.customElements.whenDefined('address-widget').then(() => {
    console.log('address-widget defined');
});