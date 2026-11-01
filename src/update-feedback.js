// src/update-feedback.js
const fs = require('fs');
let html = fs.readFileSync('event-feedback.html', 'utf8');

html = html.replace(
  "document.addEventListener('DOMContentLoaded', () => {\n      DB.seed();",
  "document.addEventListener('DOMContentLoaded', async () => {\n      await API.ready();"
);
html = html.replace(
  "document.addEventListener('DOMContentLoaded', () => {\r\n      DB.seed();",
  "document.addEventListener('DOMContentLoaded', async () => {\r\n      await API.ready();"
);

html = html.replace(
  "document.getElementById('feedbackForm').addEventListener('submit', function(e) {",
  "document.getElementById('feedbackForm').addEventListener('submit', async function(e) {"
);

html = html.replace(
  `        UI.setButtonLoading(btn, true);

        setTimeout(() => {
          const res = DB.eventFeedback.insert({
            eventId: eventId,
            clubId: ev ? ev.clubId : null,
            studentId: studentId,
            studentName: name,
            ratingOverall: parseInt(document.getElementById('rateOverall').value),
            ratingSpeaker: parseInt(document.getElementById('rateSpeaker').value),
            ratingOrganization: parseInt(document.getElementById('rateOrg').value),
            ratingRelevance: parseInt(document.getElementById('rateRelevance').value),
            comments: comments,
            suggestions: suggestions
          });

          UI.setButtonLoading(btn, false);

          if (!res.success) {
            UI.showToast(res.error, 'info');
            return;
          }

          UI.showToast('🎉 Thank you! Your event feedback has been recorded.', 'success');
          document.getElementById('fbComments').value = '';
          document.getElementById('fbSuggestions').value = '';
          renderEventFeedbackList();
        }, 400);`,
  `        UI.setButtonLoading(btn, true);

        try {
          const res = await API.eventFeedback.insert({
            eventId: eventId,
            clubId: ev ? ev.clubId : null,
            studentId: studentId,
            studentName: name,
            ratingOverall: parseInt(document.getElementById('rateOverall').value),
            ratingSpeaker: parseInt(document.getElementById('rateSpeaker').value),
            ratingOrganization: parseInt(document.getElementById('rateOrg').value),
            ratingRelevance: parseInt(document.getElementById('rateRelevance').value),
            comments: comments,
            suggestions: suggestions
          });

          UI.setButtonLoading(btn, false);

          if (!res.success) {
            UI.showToast(res.error, 'info');
            return;
          }

          UI.showToast('🎉 Thank you! Your event feedback has been recorded.', 'success');
          document.getElementById('fbComments').value = '';
          document.getElementById('fbSuggestions').value = '';
          renderEventFeedbackList();
        } catch (err) {
          UI.setButtonLoading(btn, false);
          UI.showToast('Failed to submit feedback. Please try again.', 'error');
        }`
);

fs.writeFileSync('event-feedback.html', html, 'utf8');
console.log('event-feedback.html updated successfully');

