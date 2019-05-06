import json

from event_notifier import EventNotifier


def lambda_handler(event, context):
    print(event)
    eventNotifier = EventNotifier()
    eventNotifier.notify_participants()
    
    return True