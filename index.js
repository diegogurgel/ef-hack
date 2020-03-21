var request = require('request');
const requestSchedule = require('./request-schedule');
const reqTeacherProfile = require('./request-teacher-profile');
const addEvent = require('./add-event');
const fs = require('fs');
const moment = require('moment-timezone');
const querystring = require('querystring');
require('dotenv').config();
var headers1 = {
  'content-type': 'application/x-www-form-urlencoded'
};
var dataString1 = `UserName=${process.env.EMAIL}&Password=${process.env.PASSWORD}&onsuccess=&referer=https%3A%2F%2Fenglishlive.ef.com%2Fen-us%2Flogin%2F&p=None&OnSuccessUrl=`;
var options1 = {
  url: 'https://englishlive.ef.com/login/handler.ashx',
  method: 'POST',
  headers: headers1,
  body: dataString1,
  jar: true
};

var headers = {
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7,af;q=0.6',
  'upgrade-insecure-requests': '1',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
  accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'cache-control': 'max-age=0',
  authority: 'englishlive.ef.com',
  referer: 'https://englishlive.ef.com/en-us/login/'
};

var options = {
  url:
    'https://englishlive.ef.com/school/course/currentcourse/handler.aspx?entry=true',
  headers: headers,
  jar: true
};

function callback(error, response, body) {
  if (!error && response.statusCode == 302) {
    request(options, (err, response, body) => {
      requestSchedule().then(data => {
        processResponse(data);
      });
    });
  }
}
request(options1, callback);

function processResponse(data) {
  const efData = JSON.parse(data);
  const bookedClasses = efData[0].bookedClasses;
  const ids = fs.readFileSync('./insertions.txt', 'utf8');
  const filtered = bookedClasses.filter(lesson => {
    return !ids.match(new RegExp(lesson.classId, 'gi'));
  });

  const events = filtered.map(lesson => {
    const teacher = efData.filter(data => {
      return data.memberId && data.memberId === lesson.teacherMemberId;
    })[0];
    return {
      classId: lesson.classId,
      summary: 'English class',
      location: 'Online',
      description: `${lesson.topic.topic} - ${lesson.topic.description} - ${teacher.imageUrl}`,
      hangoutLink: `${lesson.evc15TechCheckUrl}#url=${lesson.enterUrl}`,
      start: {
        dateTime: moment.tz(lesson.easternStartTime, 'Europe/Warsaw').format()
      },
      end: {
        dateTime: moment
          .tz(lesson.easternStartTime, 'Europe/Warsaw')
          .add('40', 'm')
          .format()
      },
      attachments: [
        {
          fileUrl: teacher.imageUrl,
          fileId: teacher.memberId,
          mimeType: 'image/png',
          title: 'Foto',
          iconLink: teacher.imageUrl
        }
      ],
      colorId: 2
    };
  });
  events.forEach(event => {
    addEvent(event).then(() => {
      fs.appendFile('./insertions.txt', '\n' + event.classId, err => {
        if (err) console.log(err);
      });
    });
  });
}
