/* 固定大小的HashMap */
function HashMap(slength) {
    /** Map存放的最大数量,默认10个 * */
    var set_length = (typeof (slength) == 'undefined') ? 10 : slength;

    /** Map 大小 * */
    var size = 0;
    /** 对象 * */
    var entry = new Object();

    /** 存 * */
    this.put = function (key, value) {
        if (size >= set_length) {
            entry[key] = value;
            delete entry[this.keys()[0]];
        } else {
            if (!this.containsKey(key)) {
                size++;
            }
            entry[key] = value;
        }
    }

    /** 取 * */
    this.get = function (key) {
        return this.containsKey(key) ? entry[key] : null;
    }

    /** 删除 * */
    this.remove = function (key) {
        if (this.containsKey(key) && (delete entry[key])) {
            size--;
        }
    }

    /** 是否包含 Key * */
    this.containsKey = function (key) {
        return (key in entry);
    }

    /** 是否包含 Value * */
    this.containsValue = function (value) {
        for (var prop in entry) {
            if (entry[prop] == value) {
                return true;
            }
        }
        return false;
    }

    /** 所有 Value * */
    this.values = function () {
        var values = new Array();
        for (var prop in entry) {
            // 在entry对象里面增加key属性
            var o = entry[prop];
            o.key = prop;
            values.push(o);
        }
        return values;
    }

    /** 所有 Key * */
    this.keys = function () {
        var keys = new Array();
        for (var prop in entry) {
            keys.push(prop);
        }
        return keys;
    }
    /** 所有 Key value * */
    this.keysString = function () {
        var keys = "";
        for (var prop in entry) {
            keys = keys + prop + " ";
        }
        return keys;
    }
    /** Map Size * */
    this.size = function () {
        return size;
    }

    /* 清空 */
    this.clear = function () {
        size = 0;
        entry = new Object();
    }
}