from matplotlib import pyplot as plt
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
,"YahadutHatora":["LBrwky","Pikeaccount","TESLERYANKY","YisraelEichler","mk_moshe_gafni"]
,"IsraelBeitenu":["AvigdorLiberman","Hamad_Ammar_","evgenysova","YuliaMalinovsky","oded_forer","SharonNir11"]
,"HadashTaal":["Ahmad_tibi","AyOdeh","yousefataw","AidaTuma","ofercass"]
,"Raam":["khatib_eman","WAlhwashla","Waleedt68","mnsorabbas"]
,"Haavoda":["Efratrayten1","KarivGilad","MeravMichaeli","naamalazimi"]
,"OtzzmaYehudit":["itamarbengvir","almog_cohen08","Yitzik_kroizer","ItshakWaserlauf","limor_sonhrmelh","tzvikafoghel"]
,"Noam":["noamparty"]}

party_leaders = ["Netanyahu", "yairlapid", "bezalelsm", "gantzbe", "ariyederi", "Yitzhak_Goldkno", "AvigdorLiberman", "mnsorabbas", "AyOdeh", "MeravMichaeli", "itamarbengvir"]

coalition_members = []
oposition_members = []
for party in knesset_members_by_party:
    if party in ["Halicod", "HaziyonutHadatit", "Shas", "YahadutHatora", "OtzzmaYehudit", "Noam"]: # coalition parties
        coalition_members += knesset_members_by_party[party]
    else:
        oposition_members += knesset_members_by_party[party]

ministers = ['bezalelsm', 'Netanyahu', 'Israel_katz', 'yoavgallant', 'itamarbengvir', 'Yitzhak_Goldkno', 'ariyederi', 'iditsilman', 'GalitDistel', 'oritstrock', 'OfirAkunis', 'elicoh1', 'YoavKisch', 'avidichter', 'Eliyahu_a', 'aORLB0U686MznSE', 'NirBarkat', 'GilaGamliel', 'AmbDermer', 'BentzurYoav', 'ofir_sofer', 'ItshakWaserlauf', 'GolanMay', 'yakmargi', 'AmichaiChikli', 'malkielim82', 'dudiamsalem', 'regev_miri', 'shlomo_karhi', 'zoharm7']

knesset_members = []
for party in knesset_members_by_party:
    knesset_members += knesset_members_by_party[party]

protest_leaders = ['bogie_yaalon', 'ShikmaBressler', 'barak_ehud', 'RadmanMoshe', 'ZerMoran', 'orlybarlev', 'GONENB1']
reform_leaders = ['Netanyahu', 'rothmar'] # Netanyahu & Rotman (yariv levin has no twitter account)

number_of_followers_requests = 0 # rate limit: 15 requests per 15 minutes
number_of_user_lookup_requests = 0 # rate limit: 900 requests per 15 minutes

def get_bot_percentage_in_followers(model, username): # now taking 10% of all followers, not just 100
    """
        Input: model- The model that classify our users
               username- The username whose followers we want to examine
        Returns: percentage (0%-100%) of bots among the followers of the given username
    """
    global number_of_followers_requests
    global number_of_user_lookup_requests
    res = {}
    bot_prec = [0, 0]

    # send request to get the ids of the followers of the given username
    screen_name_req = f"screen_name={username}"
    url = f"https://api.twitter.com/1.1/followers/ids.json?{screen_name_req}"
    users_ids = send_Twitter_API_request(url)["ids"]

    # check if we are about to reach rate limit of 15 followers requests per 15 minutes and if so - wait 15 minutes in order to avoid rate limit
    number_of_followers_requests += 1
    if number_of_followers_requests == NUMBER_OF_FOLLOWERS_REQUESTS_ALLOWED_IN_15_MINUTES:
        time.sleep(FIFTEEN_MINUTES)
        number_of_followers_requests = 0
        number_of_user_lookup_requests = 0 # reset also the number of user lookup requests becauese we waited 15 minutes

    numbers_of_followers = len(users_ids)
    users_sample = random.sample(users_ids, int(0.1 * numbers_of_followers)) # take randomly 10% of the followers
    # make user lookup requests in bunches of 100 users each time
    req_max_size = 100
    for i in range(0, len(users_sample), req_max_size): 
        users_batch = users_sample[i:i + req_max_size] 
        users_batch = ','.join(map(str, users_batch))
        ids_req = f"user_id={users_batch}"
        url = f"https://api.twitter.com/1.1/users/lookup.json?{ids_req}&include_entities=false"
        # Creates a request with get_user - get response object which contains user object by username
        # RECALL: client.get_users is synchronous by default
        users_response = send_Twitter_API_request(url)

        # check if we are about to reach rate limit of 900 user lookup requests per 15 minutes and if so - wait 15 minutes in order to avoid rate limit
        number_of_user_lookup_requests += 1
        if number_of_user_lookup_requests == NUMBER_OF_USER_LOOKUP_REQUESTS_ALLOWED_IN_15_MINUTES:
            time.sleep(FIFTEEN_MINUTES)
            number_of_followers_requests = 0 # reset also the number of followers requests becauese we waited 15 minutes
            number_of_user_lookup_requests = 0

        # for each user in the response - get his features and predict if he is a bot
        for user in users_response:
            meta = get_features(user)
            is_bot = model_predict_if_user_is_bot(model, meta)
            res[user["screen_name"]] = is_bot
            bot_prec[is_bot["classification"]] += 1

    # bot_prec = [number of bots humans, number of bots]
    if bot_prec[0] + bot_prec[1] == 0: # no followers - avoid division by zero
        return 0
    bot_percentage_of_followers = (bot_prec[1] / (bot_prec[0] + bot_prec[1])) * 100
    #print("res: ", res) # TODO: remove (DEBUG ONLY)
    return bot_percentage_of_followers

def get_knesset_members_bots_percentage(model, knesset_members):
    """
        Input: model- The model that classify our users
               knesset_members- The usernames of the knesset members whose followers we want to examine
        Returns: A dictonary with keys: kneset members usernames and values: percentage of bots among their followers
    """
    # for each knesset member - get bot percentage among his followers
    knesset_members_bots_percentage = {}
    for knesset_member in enumerate(knesset_members):
        knesset_members_bots_percentage[knesset_member] = get_bot_percentage_in_followers(model, knesset_member)
    return knesset_members_bots_percentage

def create_results_file_for_each_knesset_member(model, knesset_members):
    """
        Input: model- The model that classify our users
               knesset_members- The usernames of the knesset members whose followers we want to examine
        Builds for each knesset member file "[knesset_member]_bots_percentage.txt which contains the percentage of bots among his followers
        (file for each knesset member because if the program stops in the middle we can continue from the last knesset member)
    """
    for knesset_member in knesset_members:
        with open(f"{knesset_member}_bots_percentage.txt", "w") as file:
            file.write(str(get_knesset_members_bots_percentage(model, [knesset_member])))
            
def create_result_file_for_all_knesset_members(knesset_members):
    """
        Input: knesset_members- The usernames of the knesset members whose followers we want to examine
        Builds the file "all_knesset_members_bots_percentage.txt" which unites all results files into one file (the files are in "knesset" folder)
    """
    with open("all_knesset_members_bots_percentage.txt", "w") as file:
        for knesset_member in knesset_members:
            with open(f"knesset/{knesset_member}_bots_percentage.txt", "r") as knesset_member_file:
                file.write(knesset_member_file.read())
                file.write("\n")

def read_knesset_bot_percentage_file_to_dictionary():
    """
        Returns a dictionary with keys: kneset members usernames and values: percentage of bots among their followers
        {knesset_member: bot_percentage_of_his_followers}
    """
    results = {}
    with open("knesset/all_knesset_members_bots_percentage.txt", "r") as file:
        for line in file:
            data_dict = eval(line) # convert current line (string) to dictionary
            # Merge the data_dict into result_dict
            results.update(data_dict)
    return results

def read_ministers_bot_percentage_file_to_dictionary():
    """
        Returns a dictionary in format -> minister: bot_percentage_of_his_followers
    """
    results = {}
    with open("knesset/ministers_bot_percentage.txt", "r") as file:
        for line in file:
            key, value = line.strip().split(': ')
            value = float(value)
            results[key] = value

    return results

def get_parties_bot_percentages(knesset_members_bot_percentages):
    """
        Input: knesset_members_bot_percentages- A dictionary with keys: kneset members usernames and values: percentage of bots among their followers
        Returns a dictionary in format -> party: bot_percentage_of_its_members (average)
    """
    parties_bot_percentages = {} # party: bot_percentage_of_its_members (average)
    for party in knesset_members_by_party:
        # for each party - calculate the average bot percentage of its members
        parties_bot_percentages[party] = 0
        for knesset_member in knesset_members_by_party[party]:
            parties_bot_percentages[party] += knesset_members_bot_percentages[knesset_member]
        parties_bot_percentages[party] /= len(knesset_members_by_party[party])
    return parties_bot_percentages

def plot_parties_bot_percentages(knesset_members_bot_percentages):
    """
        Input: knesset_members_bot_percentages- A dictionary with keys: kneset members usernames and values: percentage of bots among their followers
        Plots a bar graph of the bot percentage of each party in descending order of the number of mandates
    """
    parties_bot_percentages = get_parties_bot_percentages(knesset_members_bot_percentages) # party: bot_percentage_of_its_members (average)
    plt.bar(range(len(parties_bot_percentages)), list(parties_bot_percentages.values()), align='center')
    plt.xticks(range(len(parties_bot_percentages)), list(parties_bot_percentages.keys()))

    print("parties_bot_percentages: ", parties_bot_percentages)
    plt.xticks(rotation=90)
    # add on top of each bar its value
    for i, v in enumerate(parties_bot_percentages.values()):
        plt.text(i - 0.5, v + 0.5, str(round(v, 2))+"%", color='blue', size=8)

    plt.title("Parties Bot Percentages")
    plt.xlabel("Party")
    plt.ylabel("Bot Percentage")
    plt.show()

def create_results_file_of_ministers(model, knesset_members_bot_percentages):
    """
        Input: model- The model that classify our users
               knesset_members_bot_percentages- A dictionary with keys: kneset members usernames and values: percentage of bots among their followers
        Builds the file "knesset/ministers_bot_percentage.txt" which contains the bot percentage of each minister
    """
    with open("knesset/ministers_bot_percentage.txt", "w") as file:
        for minister in ministers:
            # if the minister already calculated -> write his bot percentage
            if minister in knesset_members_bot_percentages:
                file.write(f"{minister}: {knesset_members_bot_percentages[minister]}\n")
            else:
                # else -> calculate his bot percentage using get_bot_percentage_in_followers(   )
                print(f"calculating bot percentage of {minister}...")
                file.write(f"{minister}: {get_bot_percentage_in_followers(model, minister)}\n")

def plot_ministers_bot_percentages(ministers_bot_percentages):
    """
        Input: ministers_bot_percentages- A dictionary with keys: ministers usernames and values: percentage of bots among their followers
        Plots a bar graph of the bot percentage of each minister in descending order of the bot percentage
    """
    # sort the dictionary by values reversed (bot percentages)
    ministers_bot_percentages = dict(sorted(ministers_bot_percentages.items(), key=lambda item: item[1], reverse=True))
    plt.bar(range(len(ministers_bot_percentages)), list(ministers_bot_percentages.values()), align='center')
    plt.xticks(range(len(ministers_bot_percentages)), list(ministers_bot_percentages.keys()))
    plt.xticks(rotation=90)

    print("ministers_bot_percentages: ", ministers_bot_percentages)

    # add on top of each bar its value
    for i, v in enumerate(ministers_bot_percentages.values()):
        plt.text(i - 0.5, v + 0.5, str(round(v, 2))+"%", color='blue', size=8)

    plt.title("Ministers Bot Percentages")
    plt.xlabel("Minister")
    plt.ylabel("Bot Percentage")
    plt.show()

def plot_coalition_oposition_bot_percentage():
    """
        Plots a bar graph of the bot percentage of the coalition and the opposition
    """
    # calculate the average bot percentage of the coalition and the opposition
    coalition_bot_percentage = 0
    for knesset_member in coalition_members:
        coalition_bot_percentage += knesset_members_bot_percentages[knesset_member]
    coalition_bot_percentage /= len(coalition_members)

    oposition_bot_percentage = 0
    for knesset_member in oposition_members:
        oposition_bot_percentage += knesset_members_bot_percentages[knesset_member]
    oposition_bot_percentage /= len(oposition_members)

    # plot the bar graph
    plt.bar(["Coalition", "Opposition"], [coalition_bot_percentage, oposition_bot_percentage], align='center')
    plt.xticks(["Coalition", "Opposition"])
    plt.xticks(rotation=90)
    # add on top of each bar its value
    for i, v in enumerate([coalition_bot_percentage, oposition_bot_percentage]):
        plt.text(i - 0.1, v + 0.5, str(round(v, 2))+"%", color='blue', size=8)

    plt.title("Coalition Vs. Opposition Bot Percentages")
    plt.xlabel("Coalition Vs. Opposition")
    plt.ylabel("Bot Percentage")
    plt.show()
        
def plot_party_leaders_bot_percentage():
    """
        plots a bar graph of the bot percentage of each party leader in descending order of the bot percentage
    """
    party_leaders_bot_percentage = {} # party: bot_percentage_of_its_members (average)
    for party_leader in party_leaders:
        if party_leader in knesset_members_bot_percentages: # if the party leader is a knesset member
            party_leaders_bot_percentage[party_leader] = knesset_members_bot_percentages[party_leader]
        else: # he is a minister and not a knesset member
            party_leaders_bot_percentage[party_leader] = ministers_bot_percentages[party_leader]
    # sort the dictionary by values reversed (bot percentages)
    party_leaders_bot_percentage = dict(sorted(party_leaders_bot_percentage.items(), key=lambda item: item[1], reverse=True))
    plt.bar(range(len(party_leaders_bot_percentage)), list(party_leaders_bot_percentage.values()), align='center')
    plt.xticks(range(len(party_leaders_bot_percentage)), list(party_leaders_bot_percentage.keys()))
    plt.xticks(rotation=90)
    # add on top of each bar its value
    for i, v in enumerate(party_leaders_bot_percentage.values()):
        plt.text(i - 0.5, v + 0.5, str(round(v, 2))+"%", color='blue', size=8)
    plt.title("Party Leaders Bot Percentages")
    plt.xlabel("Party Leader")
    plt.ylabel("Bot Percentage")
    plt.show()

def plot_protesters_leaders_vs_reform_leaders_bot_percentage():
    """
        Plots a bar graph of the bot percentage of the protest leaders and the reform leaders
    """
    # calculate the average bot percentage of the protest leaders and the reform leaders
    protest_leaders_bot_percentage = 0
    for protest_leader in protest_leaders:
        protest_leaders_bot_percentage += get_bot_percentage_in_followers(model, protest_leader)
    protest_leaders_bot_percentage /= len(protest_leaders)

    # in reform leaders we can retrieve the results from the dictionaries already calculated
    reform_leaders_bot_percentage = 0
    for reform_leader in reform_leaders:
        if reform_leader in knesset_members_bot_percentages:
            reform_leaders_bot_percentage += knesset_members_bot_percentages[reform_leader]
        elif reform_leader in ministers_bot_percentages:
            reform_leaders_bot_percentage += ministers_bot_percentages[reform_leader]
        else:
            reform_leaders_bot_percentage += get_bot_percentage_in_followers(model, reform_leader)
    reform_leaders_bot_percentage /= len(reform_leaders)

    # plot the bar graph
    plt.bar(["Protest Leaders", "Reform Leaders"], [protest_leaders_bot_percentage, reform_leaders_bot_percentage], align='center')
    plt.xticks(["Protest Leaders", "Reform Leaders"])
    plt.xticks(rotation=90)
    # add on top of each bar its value
    for i, v in enumerate([protest_leaders_bot_percentage, reform_leaders_bot_percentage]):
        plt.text(i - 0.1, v + 0.5, str(round(v, 2))+"%", color='blue', size=8)
    
    plt.title("Protest Leaders Vs. Reform Leaders Bot Percentages")
    plt.xlabel("Protest Leaders Vs. Reform Leaders")
    plt.ylabel("Bot Percentage")
    plt.show()

knesset_members_bot_percentages = read_knesset_bot_percentage_file_to_dictionary() # knesset_member: bot_percentage_of_his_followers
ministers_bot_percentages = read_ministers_bot_percentage_file_to_dictionary() # minister: bot_percentage_of_his_followers

#plot_parties_bot_percentages(knesset_members_bot_percentages)
#plot_ministers_bot_percentages(ministers_bot_percentages)
#plot_coalition_oposition_bot_percentage()
#plot_party_leaders_bot_percentage()
#plot_protesters_leaders_vs_reform_leaders_bot_percentage()