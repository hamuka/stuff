// ==UserScript==
// @name        Kong forum post unhider
// @namespace   coolpassuser
// @match       *://www.kongregate.com/forums/*/topics/*
// @match       *://www.kongregate.com/users/*/posts*
// @grant       none
// @version     2.5.1
// @author      CoolPassUser
// @description Unhide posts hidden by the niggerfaggots at Kongregate
// ==/UserScript==

// */

'use strict';

var x;

async function main() {
  let posts = document.getElementsByClassName('post');
  let pageNum = document.getElementsByClassName('current');
  pageNum = pageNum.length ? pageNum[0].innerText : '1';
  let myUserName = active_user.username();

  if(posts.length > document.getElementsByClassName('rendered_post').length) {
    let current_path = document.URL.replace(/.*:\/\/[^\/]+/, "");
    let data_url = 'https://www.kongregate.com/';
    let user_match = current_path.match(/^\/users\/[0-9]+/);
    if(user_match) {
      let user_id = user_match[0].match(/[0-9]+/)[0];
      data_url += 'users/' + user_id + '/posts.json?page=' + pageNum;
    }
    else { //if(current_path.match(/^\/forums/)) { // only other match right now
      let threadID = PostsController.instance.topicId;
      data_url += 'posts.json?topic_id=' + threadID + '&page=' + pageNum;
    }
  
    fetch(data_url) // get page info
      .then(data=>{return data.json();}) // convert to JSON
      .then(data=>{
        x = data;
        data.posts.forEach((post, i)=>{
          if(post.hidden){
          let author_data;
          data.users.forEach(user=>{if(user.id === post.user_id) {author_data = user;}});
          showPost(data, post, i, posts[i], author_data.username === myUserName, author_data);
          }
        });
    });
  };
}

async function showPost(data, post, i, post_node, isMyUserName, author_data) {
  let body = post_node.getElementsByClassName('body')[0];
  let post_id = body.children[0].dataset['postMetadataId'];
  modifyPostNode(post_node.getElementsByClassName('body')[0], post.body, post_id)
    .then(()=>{PostsController.instance.renderPosts($j('[data-post-body-id=' + post_id + ']'))});
  modifyAuthorNode(post_node.getElementsByClassName('author')[0], author_data, isMyUserName, post_id)
    .then((()=>{PostsController.instance.addEventListeners('#posts-' + post_id + '-row')}));
}

async function modifyPostNode(bodyNode, msg, post_id) {
  let entry = bodyNode.children[1];
  let rendered = document.createElement('div');
  rendered.addClassName('rendered_post');
  rendered.dataset['postId'] = post_id;

  let raw = document.createElement('div');
  raw.addClassName('raw_post');
  raw.dataset['postBodyId'] = post_id;
  raw.setAttribute('aria-hidden', 'true');
  raw.textContent = msg;

  //entry.replaceChild(rendered, entry.children[0]);
  entry.replaceChild(rendered, entry.getElementsByTagName("em")[0]);
  entry.appendChild(raw);
}

async function modifyAuthorNode(authorNode, data, isYou, postID) { // data is json_data.users[userIndex]
  let media = authorNode.getElementsByClassName('media')[0];

  // fake 'flag post' node visually displaying that the post is hidden
  createFalseFlagBox().then(flag_box=>{authorNode.insertBefore(flag_box, media)});

  if(isYou) {
    createEditBox(postID).then(edit_box=>{authorNode.getElementsByClassName('form_ctrls')[0].appendChild(edit_box)});
  }

  if(media.empty()) { // unhide author
    let image_box_done = createImageBox(postID, data.avatar_url.replace(/\?.+/, ""), data.username)
      .then((image_box=>{media.appendChild(image_box)}));
    let bd = createBDBox(postID, data.username, data.id, isYou);

    await image_box_done;
    media.appendChild(await bd);
  }

  let bd = authorNode.getElementsByClassName('bd')[0]; // either exists already or created above
  if(bd.getElementsByClassName('quote').length === 0) {
    createQuoteBox(postID).then(quote_box=>{bd.appendChild(quote_box)});
  }
}

async function createFalseFlagBox() {
  let flag_box = document.createElement('div');
  flag_box.addClassName('post_flag_link');

  let flag_link = document.createElement('a');
  flag_link.textContent = 'hidden post';
  flag_box.appendChild(flag_link);
  return flag_box;

}

async function createImageBox(postID, avatarURL, userName) {
  let image_box = document.createElement('a');
  image_box.href = '/accounts/' + userName;

  let image = document.createElement('img');
  image.setAttribute('class', 'hover_profile img man');
  image.addClassName('user_avatar');
  image.setAttribute('title', userName);
  image.setAttribute('alt', 'avatar for ' + userName);
  image.setAttribute('height', '80');
  image.setAttribute('width', '80');
  image.setAttribute('src', avatarURL);

  image_box.appendChild(image);
  return image_box;
}

async function createBDBox(postID, userName, userID, isYou) {
  let bd = document.createElement('div');
  bd.addClassName('bd');

  let name_done = createNameBox(userName, isYou)
    .then(name_box=>{bd.appendChild(name_box)});

  let posts_span = createPostsSpan(userID);
  await name_done;
  bd.appendChild(await posts_span);
  return bd;
}

async function createPostsSpan(userID) {
  let posts_span = document.createElement('span');
  posts_span.addClassName('posts');
  let posts_link = document.createElement('a');
  posts_link.href = '/users/' + userID + '/posts';
  posts_link.textContent = '6969 posts';

  posts_span.appendChild(posts_link);
  return posts_span;
}

async function createNameBox(userName, isYou) {
  let name = document.createElement('span');
  name.setAttribute('class', 'fn name');
  name.setAttribute('data-username', userName);

  let name_hover = document.createElement('a');
  name_hover.addClassName('hover_profile');
  name_hover.href = '/accounts/' + userName;
  name_hover.textContent = userName;

  name.appendChild(name_hover);
  return name;
}

async function createQuoteBox(postID) {
  let quote_box = document.createElement('p');
  quote_box.addClassName('quote');

  let quote_span = document.createElement('span');
  let quote_link = document.createElement('a');

  quote_link.href = '#';
  quote_link.setAttribute('data-post-action', 'quote');
  quote_link.setAttribute('data-post-id', postID);
  quote_link.textContent = 'Quote post';

  quote_span.appendChild(quote_link);
  quote_box.appendChild(quote_span);
  return quote_box;
}

async function createEditBox(postID) {
  let edit_box = document.createElement('span');
  edit_box.addClassName('edit');

  let edit_link = document.createElement('a');
  edit_link.href = '#';
  edit_link.setAttribute('data-post-action', 'edit');
  edit_link.setAttribute('data-post-id', postID);
  edit_link.setAttribute('class', 'utility');
  edit_link.textContent = 'Edit post';

  edit_box.appendChild(edit_link);
  return edit_box;
}

async function waitForVariables(callback) {
  var neededVars = [typeof PostsController, typeof active_user];
  if(neededVars.some(needed => needed === 'undefined')
     || typeof PostsController.instance === 'undefined') { // have to check seperately in case PostsController itself is undefined
    setTimeout(waitForVariables, 100, callback);
  }
  else
    callback();
}


waitForVariables(main);