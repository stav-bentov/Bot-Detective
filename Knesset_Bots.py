from Detector import send_Twitter_API_request
from Detector import get_features
from Detector import model_predict_if_user_is_bot
from Detector import load_model
import random
import time

FIFTEEN_MINUTES = 15 * 60
NUMBER_OF_FOLLOWERS_REQUESTS_ALLOWED_IN_15_MINUTES = 15
NUMBER_OF_USER_LOOKUP_REQUESTS_ALLOWED_IN_15_MINUTES = 900
model = load_model() # load the model once

knesset_members_by_party = {"Halicod":["avidichter","AvichayBuaron","OfirAkunis","OfirKatzMK","OsherShkalim","elicoh1","elidallal32","revivoeliyahu","AmirOhana","ArielKallner","BismuthBoaz","Netanyahu","GilaGamliel","GalitDistel","dudiamsalem","davidbitan","dillouz","dannydanon","ettyatia","hanochmilwidsky","TallyGotliv","yoavgallant","YoavKisch","YuliEdelstein","Israel_katz","GolanMay","regev_miri","MosheSaada1","nissimv","NirBarkat","HaleviAmit","Tsega__Melaku","shitrit_keti","ShalomDanino","shlomo_karhi","80Sassong"]
,"YeshAtid":["OrnaBarbivay","Elazar_stern","BToporovsky","DebbieBiton","VladimirBeliak","MazarskyTatiana","yairlapid","YSegalovitz","YoraiLahav","Yasminsfridman","MKmeircohen","MattiSarfatti","MKMickeyLevy","Meravbenari","cohen_meirav","MosheTurpaz","naorshiri","simondav14","idanroll","KElharrar","MKRonKatz","Ram_Ben_Barak","MichalShir","Shellytalmeron"]
,"HaziyonutHadatit":["MKOhadTal","ofir_sofer","oritstrock","michalwoldiger","Moshe_solomon_","tzvisuccot","rothmar"]
,"HamahaneHamamlachti":["FarkashOrit","alonschuster_mk","gantzbe","eisenkotgadi","gidonsaar","zeev_elkin","hilitrooper","MichaelBiton4","MatanKahana","pnina_tamano_sh","SharrenHaskel"]
,"Shas":["BussoUriel","ariyederi","haiimaemek","yossitaieb","malkielim82","Abutbulm"]
,"YahadutHatora":["LBrwky","Pikeaccount","TESLERYANKY","YisraelEichler","Gafni_Moshe"]
,"IsraelBeitenu":["AvigdorLiberman","Hamad_Ammar_","evgenysova","YuliaMalinovsky","oded_forer","SharonNir11"]
,"HadashTaal":["Ahmad_tibi","AyOdeh","yousefataw","AidaTuma","ofercass"]
,"raam":["khatib_eman","WAlhwashla","Waleedt68","mnsorabbas"]
,"Haavoda":["Efratrayten1","KarivGilad","MeravMichaeli","naamalazimi"]
,"OtzzmaYehudit":["itamarbengvir","almog_cohen08","Yitzik_kroizer","ItshakWaserlauf","limor_sonhrmelh","tzvikafoghel"]
,"Noam":["noamparty"]}

knesset_members = []
for party in knesset_members_by_party:
    knesset_members += knesset_members_by_party[party]


number_of_followers_requests = 0 # rate limit: 15 requests per 15 minutes
number_of_user_lookup_requests = 0 # rate limit: 900 requests per 15 minutes
def get_bot_percentage_in_followers(model, username): # now taking all followers, not just 100
    """
        Input: model- The model that classify our users
               username- The username whose followers we want to examine
        Returns: percentage (0%-100%) of bots among the followers of the given username
    """
    global number_of_followers_requests
    global number_of_user_lookup_requests
    res = {}
    # bot_prec[0] = number of humans, bot_prec[1] = number of bots
    bot_prec = [0, 0]

    screen_name_req = f"screen_name={username}"
    url = f"https://api.twitter.com/1.1/followers/ids.json?{screen_name_req}"
    users_ids = send_Twitter_API_request(url)["ids"]

    number_of_followers_requests += 1
    if number_of_followers_requests == NUMBER_OF_FOLLOWERS_REQUESTS_ALLOWED_IN_15_MINUTES:
        time.sleep(FIFTEEN_MINUTES)
        number_of_followers_requests = 0
        number_of_user_lookup_requests = 0

    numbers_of_followers = len(users_ids)
    users_sample = random.sample(users_ids, int(0.1 * numbers_of_followers)) # take 10% of the followers
    # make request in bunches of 100 users each time
    req_max_size = 100
    for i in range(0, len(users_sample), req_max_size): 
        users_batch = users_sample[i:i + req_max_size] 
        users_batch = ','.join(map(str, users_batch))
        ids_req = f"user_id={users_batch}"
        url = f"https://api.twitter.com/1.1/users/lookup.json?{ids_req}&include_entities=false"
        # Creates a request with get_user - get response object which contains user object by username
        # RECALL: client.get_users is synchronous by default
        users_response = send_Twitter_API_request(url)

        number_of_user_lookup_requests += 1
        if number_of_user_lookup_requests == NUMBER_OF_USER_LOOKUP_REQUESTS_ALLOWED_IN_15_MINUTES:
            time.sleep(FIFTEEN_MINUTES)
            number_of_followers_requests = 0
            number_of_user_lookup_requests = 0

        for user in users_response:
            meta = get_features(user)
            is_bot = model_predict_if_user_is_bot(model, meta)
            res[user["screen_name"]] = is_bot
            bot_prec[is_bot["classification"]] += 1

    # bot_prec = [number of bots humans, number of bots]
    if bot_prec[0] + bot_prec[1] == 0: # no followers - avoid division by zero
        return 0
    bot_percentage_of_followers = (bot_prec[1] / (bot_prec[0] + bot_prec[1])) * 100
    print("res: ", res) # TODO: remove (DEBUG ONLY)
    return bot_percentage_of_followers

"""
        Input: model- The model that classify our users
               knesset_members- The usernames of the knesset members whose followers we want to examine
        Returns: A dictonary with keys: kneset members usernames and values: percentage of bots among their followers
"""
def get_knesset_members_bots_percentage(model, knesset_members):
    knesset_members_bots_percentage = {}
    for knesset_member in knesset_members:
        knesset_members_bots_percentage[knesset_member] = get_bot_percentage_in_followers(model, knesset_member)
    return knesset_members_bots_percentage



# example: (DEBUG ONLY)
print(get_knesset_members_bots_percentage(model, ["tuviapeled"]))   

# real run:
# print(get_knesset_members_bots_percentage(model, knesset_members))





