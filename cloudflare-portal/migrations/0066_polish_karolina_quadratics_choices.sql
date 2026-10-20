PRAGMA foreign_keys = ON;

-- Normalize mathematical typography of choices to human-readable text.
-- The quadratic diagnostic (0065) was already published in production;
-- keep the historical migration immutable and apply these corrections here.
UPDATE self_check_questions
   SET options_json = json_set(options_json,
       '$[1].label', 'a ≠ 0',
       '$[2].label', 'b ≠ 0',
       '$[3].label', 'c ≠ 0')
 WHERE id = 'kvadraticke-funkce-rovnice-karolina-v1-q01';

UPDATE self_check_questions
   SET options_json = json_set(options_json, '$[3].label', 'ℝ')
 WHERE id IN ('kvadraticke-funkce-rovnice-karolina-v1-q11',
              'kvadraticke-funkce-rovnice-karolina-v1-q12');

UPDATE self_check_questions
   SET explanation = 'Lichost vyžaduje f(−x)=−f(x). Člen ax² se při záměně x za −x nezmění, takže při a≠0 tato podmínka nemůže platit pro všechna x.'
 WHERE id = 'kvadraticke-funkce-rovnice-karolina-v1-q22';
