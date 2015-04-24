import utils from 'utilities';

let loader = {
    set data(value) {
        this._data = value;
    },
    get data() {
        return this.data;
    }
};

export default function() {
    return utils.base.extend({}, loader, utils.eventDealer);
};
