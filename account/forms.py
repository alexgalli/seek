from django import forms

class LoginForm(forms.Form):
    username = forms.CharField(min_length=1, max_length=254, label="Username")
    password = forms.CharField(min_length=1, widget=forms.PasswordInput, label="Password")

class RegisterForm(forms.Form):
    username = forms.CharField(min_length=1, max_length=254, label="Username")
    email = forms.EmailField(label="Email address")
    password = forms.CharField(min_length=1, widget=forms.PasswordInput, label="Password")
    repassword = forms.CharField(min_length=1, widget=forms.PasswordInput, label="Re-enter password")

    def get_error_message(self):
        # if email is missing or any other field is not available
        if not "email" in self.data or not self.data["email"] or len(filter(lambda k: k != "email", self.errors.keys())) > 0:
            return "Must fill in all fields"

        # otherwise bitch about email format
        if self.errors.has_key("email"):
            return "Must provide a valid email address"

class ChangePasswordForm(forms.Form):
    oldpassword = forms.CharField(min_length=1, widget=forms.PasswordInput, label="Old password")
    password = forms.CharField(min_length=1, widget=forms.PasswordInput, label="New password")
    repassword = forms.CharField(min_length=1, widget=forms.PasswordInput, label="Re-enter new password")
