/**
 * Netlify Function version
 * Same as Vercel version but adapted for Netlify Functions
 */

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get Discord webhook URL from environment variable
  const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

  if (!DISCORD_WEBHOOK_URL) {
    console.error('DISCORD_WEBHOOK_URL environment variable is not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Discord webhook URL not configured' })
    };
  }

  // Parse GitHub webhook payload
  const githubEvent = event.headers['x-github-event'];
  const payload = JSON.parse(event.body);

  // Only process pull_request and pull_request_review events
  if (githubEvent !== 'pull_request' && githubEvent !== 'pull_request_review') {
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Event type not handled', 
        event: githubEvent 
      })
    };
  }

  try {
    // Format Discord message based on event type
    const discordPayload = formatDiscordMessage(githubEvent, payload);

    if (!discordPayload) {
      // Bot review or skipped event
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Event skipped (bot review)' })
      };
    }

    // Send to Discord
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload),
    });

    if (response.ok || response.status === 204) {
      console.log(`✅ Successfully sent ${githubEvent} notification to Discord`);
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          message: 'Notification sent to Discord',
          event: githubEvent 
        })
      };
    } else {
      const errorText = await response.text();
      console.error(`⚠️ Discord webhook returned ${response.status}:`, errorText);
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: false, 
          message: 'Failed to send to Discord',
          status: response.status 
        })
      };
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

// Same formatting functions as Vercel version
function formatDiscordMessage(eventType, payload) {
  if (eventType === 'pull_request') {
    return formatPullRequestMessage(payload);
  } else if (eventType === 'pull_request_review') {
    return formatReviewMessage(payload);
  }
}

function formatPullRequestMessage(payload) {
  const pr = payload.pull_request;
  const action = payload.action;
  const sender = payload.sender;

  let color, title, description;
  
  switch (action) {
    case 'opened':
      color = 3447003;
      title = '🆕 New Pull Request Opened';
      description = `${pr.user.login} created a new pull request`;
      break;
    case 'reopened':
      color = 10181046;
      title = '🔄 Pull Request Reopened';
      description = `${pr.user.login} reopened this pull request`;
      break;
    case 'closed':
      if (pr.merged) {
        color = 5763719;
        title = '✅ Pull Request Merged';
        description = `${pr.merged_by?.login || 'Unknown'} merged this pull request`;
      } else {
        color = 15158332;
        title = '❌ Pull Request Closed';
        description = `${pr.user.login} closed this pull request without merging`;
      }
      break;
    case 'synchronize':
      color = 16776960;
      title = '📝 Pull Request Updated';
      description = `${sender.login} pushed new commits`;
      break;
    case 'ready_for_review':
      color = 3066993;
      title = '👀 Pull Request Ready for Review';
      description = `${pr.user.login} marked this PR as ready for review`;
      break;
    default:
      color = 9807270;
      title = `📋 Pull Request ${action}`;
      description = `${sender.login} ${action} this pull request`;
  }

  return {
    username: 'PSITS CI/CD',
    avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    embeds: [{
      title: title,
      description: description,
      url: pr.html_url,
      color: color,
      fields: [
        {
          name: '📋 Pull Request',
          value: `[#${pr.number} - ${pr.title}](${pr.html_url})`,
          inline: false
        },
        {
          name: '👤 Author',
          value: `[${pr.user.login}](https://github.com/${pr.user.login})`,
          inline: true
        },
        {
          name: '🌿 Branch',
          value: `\`${pr.head.ref}\` → \`${pr.base.ref}\``,
          inline: true
        },
        {
          name: '📊 Changes',
          value: `**${pr.changed_files || 0}** files • **${pr.commits || 0}** commits\n✅ **+${pr.additions || 0}** lines • ❌ **-${pr.deletions || 0}** lines`,
          inline: false
        }
      ],
      thumbnail: {
        url: pr.user.avatar_url
      },
      footer: {
        text: 'PSITS • GitHub Webhook',
        icon_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
      },
      timestamp: new Date().toISOString()
    }]
  };
}

function formatReviewMessage(payload) {
  const review = payload.review;
  const pr = payload.pull_request;

  if (review.user.type === 'Bot' || review.user.login.includes('[bot]')) {
    return null;
  }

  let reviewEmoji, reviewColor, reviewStatus;
  
  switch (review.state) {
    case 'approved':
      reviewEmoji = '✅';
      reviewColor = 5763719;
      reviewStatus = 'Approved';
      break;
    case 'changes_requested':
      reviewEmoji = '❌';
      reviewColor = 15158332;
      reviewStatus = 'Changes Requested';
      break;
    case 'commented':
      reviewEmoji = '💬';
      reviewColor = 3447003;
      reviewStatus = 'Commented';
      break;
    default:
      reviewEmoji = '💬';
      reviewColor = 9807270;
      reviewStatus = review.state;
  }

  const reviewBody = review.body || 'No comment provided';
  const truncatedBody = reviewBody.length > 500 
    ? reviewBody.substring(0, 500) + '...' 
    : reviewBody;

  return {
    username: 'PSITS CI/CD',
    avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    embeds: [{
      title: `${reviewEmoji} PR Review: ${reviewStatus}`,
      description: `[${review.user.login}](https://github.com/${review.user.login}) reviewed pull request #${pr.number}`,
      url: pr.html_url,
      color: reviewColor,
      fields: [
        {
          name: '📋 Pull Request',
          value: `[#${pr.number} - ${pr.title}](${pr.html_url})`,
          inline: false
        },
        {
          name: '👤 Reviewer',
          value: `[${review.user.login}](https://github.com/${review.user.login})`,
          inline: true
        },
        {
          name: '📊 Review Status',
          value: `**${reviewStatus}**`,
          inline: true
        },
        {
          name: '💬 Review Comment',
          value: truncatedBody,
          inline: false
        }
      ],
      thumbnail: {
        url: review.user.avatar_url
      },
      footer: {
        text: 'PSITS • PR Review Notification',
        icon_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
      },
      timestamp: new Date().toISOString()
    }]
  };
}

