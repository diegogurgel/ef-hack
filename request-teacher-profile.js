var request = require('request');

module.exports  = function getTeacherProfile(teacherId) {
    return new Promise((resolve) => {
        var headers = {
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        };

        var dataString = `q=teacherprofile!${teacherId}`;

        var options = {
            url: 'https://englishlive.ef.com/services/api/proxy/queryproxy?c=countrycode=us|culturecode=en|partnercode=None|siteversion=4-1|studentcountrycode=us|languagecode=en',
            method: 'POST',
            headers: headers,
            body: dataString,
            jar: true
        };

        function callback(error, response, body) {
            resolve(body);
        }

        request(options, callback);
    })


}