-- The set_pick_confidence guard only covers the RPC. The iOS client writes
-- picks with a plain upsert (SupabaseDataSource.save), which sets confidence
-- directly on the table and never goes through that function — so the RPC
-- guard alone leaves the hole open.
--
-- This coerces rather than raises. An older installed app build that still
-- sends a confidence value would otherwise fail the whole pick save, and
-- losing a user's pick is worse than dropping a value the format cannot
-- score. Deliberate assignment through set_pick_confidence still errors
-- loudly, because there the caller asked for something specific.

create or replace function public.picks_clear_confidence_in_flat_format()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_scoring text;
begin
  if new.confidence is null then
    return new;
  end if;

  select l.scoring_type into v_scoring
  from leagues l
  where l.id = new.league_id;

  if v_scoring is not null
     and v_scoring not in ('ats_confidence', 'su_confidence') then
    new.confidence := null;
  end if;

  return new;
end;
$function$;

drop trigger if exists picks_confidence_format_check on public.picks;

create trigger picks_confidence_format_check
  before insert or update of confidence on public.picks
  for each row
  execute function public.picks_clear_confidence_in_flat_format();
