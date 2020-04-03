var getDateStamp = { 
    time: function() {
        let ts = Date.now();
        let date_ob = new Date(ts);
        let seconds= date_ob.getSeconds();
        let minutes= date_ob.getMinutes();
        let hours = date_ob.getHours();
        var dateStampString = (hours + ':' + minutes + ':' + seconds);
        return dateStampString;
    },
    date: function() {
        let ts = Date.now();
        let date_ob = new Date(ts);
        let date = date_ob.getDate();
        let month = date_ob.getMonth() + 1;
        let year = date_ob.getFullYear();
        var dateStampString = (month + "-" + date + "-" + year);
        return dateStampString;
        }
    };

module.exports = getDateStamp