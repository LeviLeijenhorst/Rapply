insert into public.signup_email_allowlist (id, email, added_by_email)
values ('5f0a4631-d18b-44a5-b1ee-9db8a7a1dcf6', 'ltleijenhorst@gmail.com', 'ltleijenhorst@gmail.com')
on conflict (email) do update
set added_by_email = excluded.added_by_email;
