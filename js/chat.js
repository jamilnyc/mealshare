class chat_control {
    constructor() {
        this.msg_list = $('.msg-group');
    }

    send_msg(name, msg) {
        this.msg_list.append(this.get_msg_html(name, msg, 'right'));
        this.scroll_to_bottom(); 
    }

    receive_msg(name, msg) {
        this.msg_list.append(this.get_msg_html(name, msg, 'left'));
        this.scroll_to_bottom(); 
    }

    get_msg_html(name, msg, side) {
        var msg_temple = `
            <div class="card">
                 <div class="card-body">
                     <h6 class="card-subtitle mb-2 text-muted text-${side}">${name}</h6>
                     <p class="card-text float-${side}">${msg}</p>
                 </div>
            </div>
            `;
        return msg_temple;
    }

    scroll_to_bottom() {
        this.msg_list.scrollTop(this.msg_list[0].scrollHeight);
    }
}


var chat = new chat_control();

send_button = $('button') // get jquery element from html table name
input_box = $('#userInput') // get jquery element from div id
// also you could get it by $('.form-control') or $('textarea')

function handle_msg(msg) {
    msg = msg.trim()
    msg = msg.replace(/(?:\r\n|\r|\n)/g, '<br>')
    return msg
}

function send_msg() {
    msg = handle_msg(input_box.val());
    if (msg != '') {
        // TODO: GET USERNAME FROM LOGIN
        chat.send_msg('you', msg);
        input_box.val('');

        // TODO: SEND MESSAGE TO LEX 

        document.getElementById("userInput").disabled = true;
        // TODO: GET RESPONSE FORM LEX 
        setTimeout(function(){ chat.receive_msg('LEX', 'hello'); 
                               document.getElementById("input-box").disabled = false;}, 1000);

    }
}

function box_key_pressing() {
    // control + enter was pressed
    if (event.keyCode === 10 || event.keyCode === 13) {
        send_msg();
    }
    // esc was pressed
    if (event.keyCode === 27) {
        input_box.blur();
    }
}

send_button.on('click', send_msg.bind());
input_box.on('keyup', box_key_pressing.bind());