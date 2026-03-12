# In myapp/emails.py

from djoser import email
from djoser.compat import get_user_email
from django.contrib.auth import get_user_model

User = get_user_model()


class CustomActivationEmail(email.ActivationEmail):

    def send(self, to, *args, **kwargs):
        user = self.context.get("user")
        
        to = [get_user_email(user)]
        print("Sending activation email to: ", to[0])

        super().send(to, *args, **kwargs)

# Repeat for other emails like PasswordResetEmail if needed


class CustomPasswordResetEmail(email.PasswordResetEmail):
    def send(self, to, *args, **kwargs):
        user = self.context.get("user")

        # Use user's preferred email for password reset
        if user:
            to = [user.get_notification_email()]
            print(f"Sending password reset email to: {to[0]}")

        super().send(to, *args, **kwargs)
        
        
class CustomConfirmationEmail(email.ConfirmationEmail):
    def send(self, to, *args, **kwargs):
        user = self.context.get("user")

        # Use user's preferred email for password reset
        if user and user.type in ['student', 'faculty', 'staff'] and user.professional_email:
            to = [user.professional_email] if user.professional_email else [get_user_email(user)]
        elif user:
            to = [get_user_email(user)]

        super().send(to, *args, **kwargs)
